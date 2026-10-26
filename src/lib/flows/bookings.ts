import "server-only";
import { BRANCH_ID, HOLD_MINUTES, PAY_HOURS, REMIND_HOURS } from "../config";
import { db, dbErrorIs, must } from "../supabase";
import { courtById, getActiveMethods, getCourts, getEquipment } from "../catalog";
import { dayStates, equipmentFree } from "../availability";
import { priceBooking } from "../pricing";
import { payUrl } from "../links";
import { logAction } from "../log";
import { uploadReceipt } from "../storage";
import { bookingViews } from "./views";
import { releaseHours } from "./waitlist";
import { addDaysKey, hourTs, todayKey, withinReminder } from "../time";
import * as M from "../email/messages";
import type { Admin, Booking, Equipment, Hold, Order, WaitlistEntry } from "../types";

/* Court booking lifecycle (spec §6, §8):
   cart hold → pending request → (approve) awaiting payment → (pay) verify → (confirm) approved
   with reject / unpaid / cancel branches. One checkout = one order, reviewed and paid together. */

export class FlowError extends Error {}

/* ---------- cart ---------- */
export type CartInput = {
  courtId: string; date: string; hours: number[]; players: number; equipment: Equipment;
  name: string; email: string; phone: string; claimToken?: { waitlistId: string };
};

export async function addToCart(session: string, inp: CartInput): Promise<Hold> {
  const court = await courtById(inp.courtId);
  if (!court) throw new FlowError("Choose a court.");
  if (inp.players < court.min_players || inp.players > court.max_players)
    throw new FlowError(`Players must be between ${court.min_players} and ${court.max_players}.`);

  let claim: WaitlistEntry | null = null;
  if (inp.claimToken) {
    claim = (await db().from("waitlist").select("*").eq("id", inp.claimToken.waitlistId).maybeSingle()).data as WaitlistEntry | null;
    if (!claim || claim.status !== "notified" || new Date(claim.claim_expires_at!).getTime() <= Date.now())
      throw new FlowError("This claim link has expired.");
  }
  const states = await dayStates(court.id, inp.date, session, claim?.id ?? null);
  if (inp.hours.some((h) => states[h] !== "open")) throw new FlowError("One of your slots was just taken. Pick another time.");

  const items = await getEquipment();
  const eq: Equipment = {};
  for (const [id, q] of Object.entries(inp.equipment)) {
    const it = items.find((i) => i.id === id);
    if (it && it.type === court.type && q > 0) eq[id] = Math.floor(q);
  }
  const free = await equipmentFree(inp.date, inp.hours);
  const over = Object.keys(eq).find((k) => eq[k] > (free[k] ?? 0));
  if (over) throw new FlowError(`Not enough ${items.find((i) => i.id === over)?.name ?? over} free for that time.`);

  const price = priceBooking(court, inp.hours.length, eq, items);
  const expires = claim?.claim_expires_at ?? new Date(Date.now() + HOLD_MINUTES * 60e3).toISOString();
  try {
    const id = must(await db().rpc("create_hold", {
      p_session: session, p_court: court.id, p_date: inp.date, p_hours: [...inp.hours].sort((a, b) => a - b),
      p_players: inp.players, p_equipment: eq, p_court_fee: price.courtFee, p_equipment_fee: price.equipmentFee,
      p_total: price.total, p_name: inp.name, p_email: inp.email, p_phone: inp.phone, p_expires: expires, p_waitlist_id: claim?.id ?? null,
    })) as string;
    return must(await db().from("holds").select("*").eq("id", id).single()) as Hold;
  } catch (e) {
    if (dbErrorIs(e, "slot_taken")) throw new FlowError("One of your slots was just taken. Pick another time.");
    throw e;
  }
}

export async function getCart(session: string | null): Promise<Hold[]> {
  if (!session) return [];
  return must(await db().from("holds").select("*").eq("session_id", session).gt("expires_at", new Date().toISOString()).order("created_at")) as Hold[];
}

export async function removeFromCart(session: string, holdId: string) {
  const h = (await db().from("holds").select("*").eq("id", holdId).eq("session_id", session).maybeSingle()).data as Hold | null;
  if (!h) return;
  await db().from("holds").delete().eq("id", h.id);
  if (h.waitlist_id) await db().from("waitlist").update({ status: "expired" }).eq("id", h.waitlist_id);
  await releaseHours(h.court_id, h.date, h.hours);
}

/** "Send booking request": the cart becomes one order of pending bookings */
export async function submitRequest(session: string): Promise<{ orderId: string; refs: string[] }> {
  const cart = await getCart(session);
  if (!cart.length) throw new FlowError("Your cart is empty, or your holds expired. Please pick your times again.");
  const who = cart[0];
  const free = cart.reduce((a, h) => a + h.total, 0) <= 0;
  let orderId: string;
  try {
    orderId = must(await db().rpc("submit_cart", { p_session: session, p_name: who.name, p_email: who.email, p_phone: who.phone, p_free: free })) as string;
  } catch (e) {
    if (dbErrorIs(e, "cart_empty")) throw new FlowError("Your holds expired. Please pick your times again.");
    throw e;
  }
  const l = await orderBookings(orderId);
  const views = await bookingViews(l);
  await M.mailRequestReceived(who, views, free);
  await M.mailAdminNewRequest(who, views);
  return { orderId, refs: l.map((b) => b.ref) };
}

/* ---------- loading ---------- */
export async function orderBookings(orderId: string, status?: string): Promise<Booking[]> {
  let q = db().from("bookings").select("*").eq("order_id", orderId);
  if (status) q = q.eq("status", status);
  return must(await q.order("date").order("created_at")) as Booking[];
}
export async function getOrder(orderId: string): Promise<Order | null> {
  return (await db().from("orders").select("*").eq("id", orderId).maybeSingle()).data as Order | null;
}
async function bookingAndSiblings(bookingId: string) {
  const b = (await db().from("bookings").select("*").eq("id", bookingId).eq("branch_id", BRANCH_ID).maybeSingle()).data as Booking | null;
  if (!b) throw new FlowError("Booking not found.");
  const l = await orderBookings(b.order_id, b.status);
  const order = (await getOrder(b.order_id))!;
  return { b, l, order };
}

/* ---------- admin: approve / confirm / reject ---------- */
/** pending → awaiting payment (₱0 → approved); verify → approved. Acts on the whole order. */
export async function approve(admin: Admin, bookingId: string): Promise<string> {
  const { b, l, order } = await bookingAndSiblings(bookingId);
  const refs = l.map((x) => x.ref).join(", ");
  const ord = l.length > 1 ? ` (order of ${l.length})` : "";
  const views = await bookingViews(l);
  const total = l.reduce((a, x) => a + x.total, 0);

  if (b.status === "pending" && total > 0) {
    const now = new Date(), due = new Date(now.getTime() + PAY_HOURS * 3600e3).toISOString();
    must(await db().from("orders").update({ approved_at: now.toISOString(), pay_due_at: due }).eq("id", order.id));
    must(await db().from("bookings").update({ status: "awaiting" }).in("id", l.map((x) => x.id)));
    for (const x of l) await logAction(admin, "Request approved", x.ref, "Waiting for payment" + ord);
    await M.mailPleasePay("court", order, views, due, await getActiveMethods(), payUrl("court", order.id, due));
    return `${refs} approved. Customer emailed the payment details (24 hours to pay).`;
  }
  if (b.status !== "pending" && b.status !== "verify") throw new FlowError("This booking can't be approved now.");
  const paid = b.status === "verify";
  must(await db().from("bookings").update({ status: "approved" }).in("id", l.map((x) => x.id)));
  // starting within 24 h: the confirmation email doubles as the reminder
  const soon = l.filter((x) => startsWithinReminder(x.date, x.hours)).map((x) => x.id);
  if (soon.length) must(await db().from("bookings").update({ reminded_at: new Date().toISOString() }).in("id", soon));
  for (const x of l) await logAction(admin, paid ? "Payment verified" : "Approved", x.ref, (paid ? "Booking confirmed" : "No payment needed") + ord);
  await M.mailConfirmed(order, views, paid);
  return `${refs} confirmed. Customer emailed.`;
}

/** pending (nothing paid) or verify (refunded in full) → rejected */
export async function reject(admin: Admin, bookingId: string, reason: string): Promise<string> {
  const { b, l, order } = await bookingAndSiblings(bookingId);
  if (b.status !== "pending" && b.status !== "verify") throw new FlowError("This booking can't be rejected now.");
  const paid = b.status === "verify";
  must(await db().from("bookings").update({ status: "rejected", reason, refund_pct: paid ? 100 : null }).in("id", l.map((x) => x.id)));
  for (const x of l) await logAction(admin, paid ? "Payment rejected" : "Request rejected", x.ref, reason + (l.length > 1 ? ` (order of ${l.length})` : ""));
  await M.mailRejected(order, await bookingViews(l), reason, paid);
  for (const x of l) await releaseHours(x.court_id, x.date, x.hours);
  return `${l.map((x) => x.ref).join(", ")} rejected. Customer emailed.`;
}

/** approved → cancelled (reason required, refund per policy §17) */
export async function cancel(admin: Admin, bookingId: string, reason: string, refundPct: number): Promise<string> {
  const b = (await db().from("bookings").select("*").eq("id", bookingId).single()).data as Booking;
  if (b.status !== "approved") throw new FlowError("Only confirmed bookings can be cancelled.");
  must(await db().from("bookings").update({ status: "cancelled", reason, refund_pct: refundPct }).eq("id", b.id));
  await logAction(admin, "Cancelled", b.ref, reason);
  await M.mailCancelled(b, (await bookingViews([b]))[0], reason, refundPct);
  await releaseHours(b.court_id, b.date, b.hours);
  return `${b.ref} cancelled. Customer emailed.`;
}

/** edit / reschedule a confirmed booking: court, date, time, players, equipment */
export async function edit(admin: Admin, bookingId: string, n: { courtId: string; date: string; hours: number[]; players: number; equipment: Equipment }): Promise<string> {
  const b = (await db().from("bookings").select("*").eq("id", bookingId).single()).data as Booking;
  if (b.status !== "approved") throw new FlowError("Only confirmed bookings can be edited.");
  const court = await courtById(n.courtId);
  if (!court) throw new FlowError("Choose a court.");
  if (!n.hours.length) throw new FlowError("Choose at least one time slot.");
  if (n.players < court.min_players || n.players > court.max_players) throw new FlowError(`Players must be between ${court.min_players} and ${court.max_players}.`);
  const states = await dayStates(court.id, n.date, null);
  const own = new Set(b.court_id === court.id && b.date === n.date ? b.hours : []);
  if (n.hours.some((h) => states[h] !== "open" && !(own.has(h) && states[h] === "taken"))) throw new FlowError("One of the chosen slots is no longer available.");
  const items = await getEquipment();
  const free = await equipmentFree(n.date, n.hours, { excludeBooking: b.id });
  const over = Object.keys(n.equipment).find((k) => n.equipment[k] > (free[k] ?? 0));
  if (over) throw new FlowError(`Not enough ${items.find((i) => i.id === over)?.name} free for that time.`);

  const old = { court_id: b.court_id, date: b.date, hours: b.hours, total: b.total };
  try {
    must(await db().rpc("move_booking", { p_booking: b.id, p_court: court.id, p_date: n.date, p_hours: [...n.hours].sort((x, y) => x - y) }));
  } catch (e) {
    if (dbErrorIs(e, "slot_taken")) throw new FlowError("One of the chosen slots is no longer available.");
    throw e;
  }
  const price = priceBooking(court, n.hours.length, n.equipment, items);
  // a new start time gets its own reminder, unless it is already within the reminder window
  const moved = old.date !== n.date || Math.min(...old.hours) !== Math.min(...n.hours);
  const reminder = moved ? { reminded_at: startsWithinReminder(n.date, n.hours) ? new Date().toISOString() : null } : {};
  must(await db().from("bookings").update({ players: n.players, equipment: n.equipment, court_fee: price.courtFee, equipment_fee: price.equipmentFee, total: price.total, ...reminder }).eq("id", b.id));
  const nb = (await db().from("bookings").select("*").eq("id", b.id).single()).data as Booking;
  const courts = await getCourts();
  await logAction(admin, "Edited", b.ref, `Now ${court.name}, ${n.date} ${n.hours.join(",")}`);
  await M.mailEdited(nb, (await bookingViews([nb]))[0], { court: courts.find((c) => c.id === old.court_id)?.name ?? old.court_id, date: old.date, hours: old.hours, total: old.total });
  const freed = old.court_id !== nb.court_id || old.date !== nb.date ? old.hours : old.hours.filter((h) => !nb.hours.includes(h));
  await releaseHours(old.court_id, old.date, freed);
  return `${b.ref} updated. Customer emailed.`;
}

/* ---------- customer: pay after approval ---------- */
export async function submitPayment(orderId: string, methodId: string, payRef: string, file: File): Promise<void> {
  const order = await getOrder(orderId);
  const l = await orderBookings(orderId, "awaiting");
  if (!order || !l.length) throw new FlowError("This request can no longer be paid.");
  if (order.pay_due_at && new Date(order.pay_due_at).getTime() <= Date.now()) throw new FlowError("The payment window has ended.");
  const method = (await getActiveMethods()).find((m) => m.id === methodId);
  if (!method) throw new FlowError("Choose how you paid.");
  if (payRef.trim().length < 4) throw new FlowError("Enter the reference number from your receipt.");
  const path = await uploadReceipt(file, `orders/${orderId}`);
  must(await db().from("orders").update({ method_id: method.id, method_name: method.name, pay_ref: payRef.trim(), proof_path: path, paid_at: new Date().toISOString() }).eq("id", orderId));
  must(await db().from("bookings").update({ status: "verify" }).in("id", l.map((x) => x.id)));
  const views = await bookingViews(l);
  await M.mailPaymentReceived("court", order, views);
  await M.mailAdminVerify("court", order, views, method.name, payRef.trim());
}

/* ---------- cron: unpaid requests expire 24 h after approval ---------- */
export async function expireUnpaidOrders(): Promise<number> {
  const now = new Date().toISOString();
  const rows = must(await db().from("bookings").select("order_id, orders!inner(pay_due_at)").eq("branch_id", BRANCH_ID)
    .eq("status", "awaiting").lte("orders.pay_due_at", now)) as unknown as { order_id: string }[];
  let n = 0;
  for (const id of new Set(rows.map((r) => r.order_id))) {
    const o = (await getOrder(id))!;
    const l = await orderBookings(o.id, "awaiting");
    if (!l.length) continue;
    const reason = "Not paid within 24 hours of approval";
    must(await db().from("bookings").update({ status: "unpaid", reason }).in("id", l.map((x) => x.id)));
    for (const x of l) await logAction(null, "Expired (not paid)", x.ref);
    await M.mailExpired(o, await bookingViews(l));
    for (const x of l) await releaseHours(x.court_id, x.date, x.hours);
    n++;
  }
  return n;
}

/* ---------- cron: reminder email 24 h before a confirmed booking ---------- */
const startOf = (date: string, hours: number[]) => hourTs(date, Math.min(...hours));
const startsWithinReminder = (date: string, hours: number[]) => withinReminder(date, Math.min(...hours));
export async function remindUpcoming(): Promise<number> {
  const today = todayKey();
  const rows = must(await db().from("bookings").select("*").eq("branch_id", BRANCH_ID).eq("status", "approved")
    .is("reminded_at", null).gte("date", today).lte("date", addDaysKey(today, Math.ceil(REMIND_HOURS / 24)))) as Booking[];
  let n = 0;
  for (const b of rows) {
    const start = startOf(b.date, b.hours);
    if (start <= Date.now() || !startsWithinReminder(b.date, b.hours)) continue;
    // claim the row first so an overlapping run can't email twice
    const claimed = must(await db().from("bookings").update({ reminded_at: new Date().toISOString() })
      .eq("id", b.id).is("reminded_at", null).select("id")) as { id: string }[];
    if (!claimed.length) continue;
    await M.mailReminder(b, (await bookingViews([b]))[0], `reminder:${b.id}:${start}`);
    n++;
  }
  return n;
}
