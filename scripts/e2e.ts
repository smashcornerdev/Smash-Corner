/* End-to-end check against the real Supabase project (emails print to the console unless RESEND_API_KEY is set).
   npm run test:e2e  — creates test rows (e2e.test@example.com) and deletes them at the end. */
import { db } from "@/lib/supabase";
import { addDaysKey, todayKey } from "@/lib/time";
import { dayStates } from "@/lib/availability";
import { addToCart, approve, edit, expireUnpaidOrders, getCart, orderBookings, reject, submitPayment, submitRequest } from "@/lib/flows/bookings";
import { approveReg, register, submitClassPayment } from "@/lib/flows/classes";
import { approveEntry, processSlot } from "@/lib/flows/waitlist";
import type { Admin } from "@/lib/types";

const admin: Admin = { email: "admin1@smashcorner-qc.com", name: "Admin One (e2e)", role: "super_admin" };
const EMAIL = "e2e.test@example.com", WAIT = "e2e.wait@example.com";
let fails = 0;
const ok = (c: unknown, m: string) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const status = async (ids: string[]) => ((await db().from("bookings").select("status").in("id", ids)).data ?? []).map((r) => r.status as string);
const receipt = () => new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "receipt.pdf", { type: "application/pdf" });

async function cleanup() {
  const orders = ((await db().from("orders").select("id").in("email", [EMAIL, WAIT])).data ?? []).map((o) => o.id);
  const bookings = ((await db().from("bookings").select("id, ref").in("order_id", orders.length ? orders : ["00000000-0000-0000-0000-000000000000"])).data ?? []);
  const proofs = ((await db().from("orders").select("proof_path").in("id", orders.length ? orders : ["00000000-0000-0000-0000-000000000000"])).data ?? []).map((o) => o.proof_path).filter(Boolean);
  const classes = ((await db().from("classes").select("id").like("title", "E2E %")).data ?? []).map((k) => k.id);
  const regs = ((await db().from("class_registrations").select("ref, proof_path").in("class_id", classes.length ? classes : ["00000000-0000-0000-0000-000000000000"])).data ?? []);
  if (proofs.length || regs.some((r) => r.proof_path)) await db().storage.from("receipts").remove([...proofs, ...regs.map((r) => r.proof_path).filter(Boolean)] as string[]);
  await db().from("holds").delete().like("session_id", "e2e-%");
  await db().from("waitlist").delete().in("email", [EMAIL, WAIT]);
  if (bookings.length) await db().from("bookings").delete().in("id", bookings.map((b) => b.id));
  if (orders.length) await db().from("orders").delete().in("id", orders);
  if (classes.length) { await db().from("class_registrations").delete().in("class_id", classes); await db().from("classes").delete().in("id", classes); }
  await db().from("activity_log").delete().in("ref", [...bookings.map((b) => b.ref), ...regs.map((r) => r.ref), "E2E Clinic"]);
  await db().from("activity_log").delete().eq("admin_name", "Admin One (e2e)");
}

async function main() {
  await cleanup();
  const date = addDaysKey(todayKey(), 1);
  const states = await dayStates("p1", date, null);
  const hours = Object.entries(states).filter(([, s]) => s === "open").map(([h]) => Number(h)).slice(0, 3);
  ok(hours.length === 3, `found open hours on Pickleball Court 1, ${date}: ${hours.join(", ")}`);
  const [h1, h2, h3] = hours;
  const who = { name: "E2E Tester", email: EMAIL, phone: "0917 123 4567" };

  // cart → request
  const s = "e2e-" + Date.now();
  await addToCart(s, { courtId: "p1", date, hours: [h1], players: 2, equipment: { paddle: 2 }, ...who });
  ok((await getCart(s)).length === 1 && (await getCart(s))[0].total === 800 + 100 * 2, "cart hold created with court fee + paddles (₱1,000)");
  ok((await dayStates("p1", date, s))[h1] === "cart" && (await dayStates("p1", date, "someone-else"))[h1] === "reserved", "held hour shows 'in your cart' to me and 'held' to others");
  let blocked = false;
  try { await addToCart("e2e-other", { courtId: "p1", date, hours: [h1], players: 2, equipment: {}, ...who }); } catch { blocked = true; }
  ok(blocked, "a second customer can't put the same hour in their cart");
  const { orderId, refs } = await submitRequest(s);
  const ids = (await orderBookings(orderId)).map((b) => b.id);
  ok((await status(ids)).every((x) => x === "pending"), `request sent: ${refs.join(", ")} pending`);

  // approve → awaiting → pay → verify → confirm
  console.log("  " + await approve(admin, ids[0]));
  const order = (await db().from("orders").select("*").eq("id", orderId).single()).data;
  ok((await status(ids))[0] === "awaiting" && order.pay_due_at, "approved: awaiting payment with a 24-hour deadline");
  await submitPayment(orderId, (await db().from("payment_methods").select("id").eq("name", "GCash").single()).data!.id, "9988 7766", receipt());
  ok((await status(ids))[0] === "verify", "customer paid with proof uploaded to the private bucket: verifying payment");
  console.log("  " + await approve(admin, ids[0]));
  ok((await status(ids))[0] === "approved", "payment confirmed: booking approved");

  // edit / reschedule
  console.log("  " + await edit(admin, ids[0], { courtId: "p1", date, hours: [h2], players: 3, equipment: {} }));
  const moved = (await db().from("bookings").select("hours, total, edited").eq("id", ids[0]).single()).data!;
  ok(moved.hours[0] === h2 && moved.total === 800 && moved.edited, "rescheduled to the next hour, price recalculated (₱800)");
  ok((await dayStates("p1", date, null))[h1] === "open", "the old hour was released");

  // reject a request → waitlist hand-off
  const s2 = "e2e-" + (Date.now() + 1);
  await addToCart(s2, { courtId: "p1", date, hours: [h3], players: 2, equipment: {}, ...who });
  const r2 = await submitRequest(s2);
  const b2 = (await orderBookings(r2.orderId))[0];
  const wl = (await db().from("waitlist").insert({ court_id: "p1", date, hour: h3, name: "E2E Waiter", email: WAIT, phone: "0917 000 0000", players: 2 }).select("id, status").single()).data!;
  ok(wl.status === "applied", "a new waitlist entry starts as an application");
  console.log("  " + await approveEntry(admin, wl.id));
  ok((await db().from("waitlist").select("status").eq("id", wl.id).single()).data!.status === "waiting", "approving puts the applicant in line");
  console.log("  " + await reject(admin, b2.id, "That time is no longer available."));
  const w = (await db().from("waitlist").select("status, claim_expires_at").eq("email", WAIT).single()).data!;
  ok(w.status === "notified" && w.claim_expires_at, "rejecting freed the hour and emailed the first person on the waitlist a 2-hour claim");
  ok((await dayStates("p1", date, null))[h3] === "reserved", "the freed hour is held for the claimant");

  // unpaid expiry
  const s3 = "e2e-" + (Date.now() + 2);
  await addToCart(s3, { courtId: "p1", date, hours: [h1], players: 2, equipment: {}, ...who });
  const r3 = await submitRequest(s3);
  const b3 = (await orderBookings(r3.orderId))[0];
  await approve(admin, b3.id);
  await db().from("orders").update({ pay_due_at: new Date(Date.now() - 1000).toISOString() }).eq("id", r3.orderId);
  await expireUnpaidOrders();
  ok((await status([b3.id]))[0] === "unpaid" && (await dayStates("p1", date, null))[h1] === "open", "not paid in 24 hours: unpaid, hour released");

  // class: register → approve → pay → confirm
  const k = (await db().from("classes").insert({ title: "E2E Clinic", court_id: "t1", date: addDaysKey(todayKey(), 20), start_hour: 9, end_hour: 11, deadline: new Date(Date.now() + 10 * 86400e3).toISOString(), capacity: 2, fee: 500, rental_fee: 150, rental_qty: 1, created_by: "e2e" }).select().single()).data!;
  const reg = await register({ classId: k.id, name: "E2E Kid", nickname: "Kiddo", age: 11, email: EMAIL, phone: "0917 123 4567", rent: true });
  ok(reg.status === "pending" && reg.total === 650 && reg.ref.startsWith("CL-"), `class registration ${reg.ref} pending, ₱650 with rental`);
  await approveReg(admin, reg.id);
  await submitClassPayment(reg.id, (await db().from("payment_methods").select("id").eq("name", "Maya").single()).data!.id, "5555 1111", receipt());
  await approveReg(admin, reg.id);
  ok((await db().from("class_registrations").select("status").eq("id", reg.id).single()).data!.status === "approved", "class payment confirmed: registration approved");
  ok((await dayStates("t1", k.date, null))[9] === "class", "the class blocks court bookings at its time");

  await processSlot("p1", date, h3); // no-op check: already reserved
}

main()
  .catch((e) => { console.error(e); fails++; })
  .finally(async () => { await cleanup(); console.log(fails ? `\n${fails} check(s) failed` : "\nAll checks passed. Test data removed."); process.exit(fails ? 1 : 0); });
