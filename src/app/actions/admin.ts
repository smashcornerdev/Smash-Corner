"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { BRANCH_ID, CLOSE_HOUR, CLOSURE_CATEGORIES, OPEN_HOUR, RENT_ITEM } from "@/lib/config";
import { db, must } from "@/lib/supabase";
import { logAction } from "@/lib/log";
import { receiptUrl, uploadQr } from "@/lib/storage";
import { hourTs } from "@/lib/time";
import { FlowError, approve, cancel, edit, reject } from "@/lib/flows/bookings";
import { approveReg, cancelClass, rejectReg } from "@/lib/flows/classes";
import { applyClosure, type ClosureDraft } from "@/lib/flows/closures";
import { approveEntry, declineEntry, notifyWaitlist, processSlot } from "@/lib/flows/waitlist";
import { dayStates } from "@/lib/availability";
import { normPhone } from "@/lib/blacklist";
import type { WaitlistEntry } from "@/lib/types";

/* All admin mutations. Each one re-checks the signed-in admin (and role) on the server (spec §7 Access). */

/** a fresh short-lived link to an order's proof of payment, fetched when a preloaded booking card opens (spec §7, v5.76) */
export async function proofLinkAction(orderId: string): Promise<{ url: string | null; pdf: boolean }> {
  await assertAdmin();
  const { data } = await db().from("orders").select("proof_path").eq("id", orderId).maybeSingle();
  const path = (data as { proof_path: string | null } | null)?.proof_path ?? null;
  return { url: await receiptUrl(path), pdf: !!path?.endsWith(".pdf") };
}

/** run, then go back to `back` with a message banner */
async function act(back: string, fn: () => Promise<string>): Promise<never> {
  let msg: string, kind = "ok";
  try {
    msg = await fn();
  } catch (e) {
    if (!(e instanceof FlowError)) console.error(e);
    msg = e instanceof Error ? e.message : "Something went wrong.";
    kind = "err";
  }
  revalidatePath("/admin", "layout");
  const sep = back.includes("?") ? "&" : "?";
  redirect(`${back}${sep}msg=${encodeURIComponent(msg)}&k=${kind}&n=${Date.now()}`); // n: lets an open modal tell repeat messages apart
}
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const backOf = (fd: FormData, fallback: string) => {
  const b = s(fd, "back");
  return b.startsWith("/admin") ? b : fallback;
};

/* ---------- court bookings ---------- */
export async function approveBookingAction(fd: FormData) {
  const a = await assertAdmin();
  return act(backOf(fd, "/admin/bookings/pending"), () => approve(a, s(fd, "id")));
}
export async function rejectBookingAction(fd: FormData) {
  const a = await assertAdmin();
  return act(backOf(fd, "/admin/bookings/pending"), () => reject(a, s(fd, "id"), s(fd, "reason")));
}
export async function cancelBookingAction(fd: FormData) {
  const a = await assertAdmin();
  const reason = s(fd, "reason"), by = s(fd, "by");
  return act(backOf(fd, "/admin/bookings/approved"), async () => {
    if (reason.length < 4) throw new FlowError("Write a short reason. The customer will see it.");
    const refund = by === "venue" ? 100 : Number(s(fd, "refund"));
    if (![0, 50, 100].includes(refund)) throw new FlowError("Choose a refund.");
    return cancel(a, s(fd, "id"), reason + (by === "venue" ? " (cancelled by Smash Corner)" : ""), refund);
  });
}
const editSchema = z.object({ id: z.string().uuid(), courtId: z.string(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), hours: z.array(z.number().int()), players: z.number().int(), equipment: z.record(z.string(), z.number().int().min(0)) });
export async function editBookingAction(input: z.input<typeof editSchema>): Promise<{ ok: boolean; error?: string; msg?: string }> {
  const a = await assertAdmin();
  const p = editSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Check the changes." };
  try {
    const msg = await edit(a, p.data.id, p.data);
    revalidatePath("/admin", "layout");
    return { ok: true, msg };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

/* ---------- waitlist ---------- */
export async function waitlistAction(fd: FormData) {
  const a = await assertAdmin();
  const id = s(fd, "id"), op = s(fd, "op");
  return act("/admin/waitlist", async () => {
    if (op === "approve") return approveEntry(a, id);
    if (op === "decline") return declineEntry(a, id);
    const w = (await db().from("waitlist").select("*").eq("id", id).single()).data as WaitlistEntry;
    if (op === "notify") {
      if (w.status !== "waiting") throw new FlowError("Only people already in line can be notified.");
      const st = (await dayStates(w.court_id, w.date, null))[w.hour];
      if (st !== "open") throw new FlowError("That slot isn't free right now.");
      await notifyWaitlist(w);
      await logAction(a, "Waitlist notified", `${w.court_id} ${w.date} ${w.hour}:00`, w.name);
      return `Claim link emailed to ${w.name}.`;
    }
    const was = w.status;
    must(await db().from("waitlist").update({ status: "removed" }).eq("id", id));
    await db().from("slot_locks").delete().eq("waitlist_id", id);
    if (was === "notified") await processSlot(w.court_id, w.date, w.hour);
    await logAction(a, "Waitlist removed", `${w.court_id} ${w.date} ${w.hour}:00`, w.name);
    return `${w.name} removed from the waitlist.`;
  });
}

/* ---------- classes ---------- */
export async function approveRegAction(fd: FormData) {
  const a = await assertAdmin();
  return act(backOf(fd, "/admin/classes/pending"), () => approveReg(a, s(fd, "id")));
}
export async function rejectRegAction(fd: FormData) {
  const a = await assertAdmin();
  return act(backOf(fd, "/admin/classes/pending"), () => rejectReg(a, s(fd, "id"), s(fd, "reason")));
}
export async function classStatusAction(fd: FormData) {
  const a = await assertAdmin();
  const id = s(fd, "id"), op = s(fd, "op");
  return act("/admin/classes", async () => {
    if (op === "cancel") return cancelClass(a, id);
    const k = must(await db().from("classes").select("*").eq("id", id).single()) as { title: string; deadline: string };
    if (op === "reopen" && new Date(k.deadline).getTime() <= Date.now()) throw new FlowError("The registration deadline has passed.");
    must(await db().from("classes").update({ status: op === "close" ? "closed" : "open" }).eq("id", id));
    await logAction(a, op === "close" ? "Class registration closed" : "Class registration reopened", k.title);
    return op === "close" ? `Registration closed. "${k.title}" is no longer on the Book page.` : "Registration reopened.";
  });
}
const classSchema = z.object({
  title: z.string().trim().min(3, "Enter a title.").max(120), courtId: z.string(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  start: z.coerce.number().int(), end: z.coerce.number().int(), deadline: z.string().min(10, "Choose a registration deadline."),
  capacity: z.coerce.number().int().min(1, "Capacity is at least 1."), fee: z.coerce.number().int().min(0, "The fee is 0 or more."),
  rentals: z.enum(["yes", "no"]), rentalFee: z.coerce.number().int().min(0).optional(), rentalQty: z.coerce.number().int().min(0).optional(),
});
/** returns the error instead of redirecting, so the open form keeps what the admin typed; on success it redirects as usual */
export async function openClassAction(fd: FormData): Promise<{ error: string }> {
  const a = await assertAdmin();
  let done: string;
  try {
    done = await openClass(a, fd);
  } catch (e) {
    if (!(e instanceof FlowError)) console.error(e);
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
  return act("/admin/classes", async () => done);
}
async function openClass(a: Awaited<ReturnType<typeof assertAdmin>>, fd: FormData) {
  const p = classSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) throw new FlowError(p.error.issues[0]?.message ?? "Check the form.");
  const d = p.data;
  if (!(d.start >= OPEN_HOUR && d.end <= CLOSE_HOUR && d.end > d.start)) throw new FlowError("Choose a start and end time within opening hours.");
  const startTs = hourTs(d.date, d.start);
  const deadline = new Date(`${d.deadline}:00+08:00`).getTime();
  if (startTs <= Date.now()) throw new FlowError("The class time has already started.");
  if (!(deadline > Date.now() && deadline < startTs)) throw new FlowError("The deadline must be in the future and before the class starts.");
  const hours = Array.from({ length: d.end - d.start }, (_, i) => d.start + i);
  const states = await dayStates(d.courtId, d.date, null);
  if (hours.some((h) => states[h] === "closed")) throw new FlowError("The court is closed at that time.");
  if (hours.some((h) => states[h] === "class")) throw new FlowError("Another class already uses the court at that time.");
  const clash = must(await db().from("bookings").select("ref, hours").eq("court_id", d.courtId).eq("date", d.date).in("status", ["pending", "awaiting", "verify", "approved"])) as { ref: string; hours: number[] }[];
  const hit = clash.filter((b) => b.hours.some((h) => hours.includes(h)));
  if (hit.length) throw new FlowError(`Court bookings already use that time: ${hit.map((b) => b.ref).join(", ")}. Move them first.`);
  const k = must(await db().from("classes").insert({
    branch_id: BRANCH_ID, title: d.title, court_id: d.courtId, date: d.date, start_hour: d.start, end_hour: d.end, deadline: new Date(deadline).toISOString(),
    capacity: d.capacity, fee: d.fee, rental_fee: d.rentals === "yes" ? d.rentalFee ?? 0 : null, rental_qty: d.rentals === "yes" ? d.rentalQty ?? 0 : 0, created_by: a.name,
  }).select().single()) as { title: string };
  // cart holds on those hours are dropped
  const holds = must(await db().from("holds").select("id, hours").eq("court_id", d.courtId).eq("date", d.date)) as { id: string; hours: number[] }[];
  const drop = holds.filter((h) => h.hours.some((x) => hours.includes(x))).map((h) => h.id);
  if (drop.length) await db().from("holds").delete().in("id", drop);
  await logAction(a, "Class registration opened", k.title, `${d.courtId} · ${d.date} ${d.start}–${d.end} · ${d.capacity} slots`);
  return `Registration is open. "${k.title}" is now on the Book page.`;
}

/* ---------- management (super-admins) ---------- */
export async function closureAction(fd: FormData) {
  const a = await assertAdmin({ superOnly: true });
  return act("/admin/closures", async () => {
    const courts = fd.getAll("courts").map(String);
    const from = s(fd, "from"), to = s(fd, "to") || from, weekly = s(fd, "repeat") === "weekly", noEnd = fd.get("noEnd") === "on";
    const days = fd.getAll("days").map(Number);
    const allDay = s(fd, "mode") !== "hours";
    const start = allDay ? OPEN_HOUR : Number(s(fd, "start")), end = allDay ? CLOSE_HOUR : Number(s(fd, "end"));
    const category = s(fd, "category");
    if (!courts.length) throw new FlowError("Choose at least one court.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new FlowError("Choose the dates.");
    if (to < from) throw new FlowError("The end date is before the start date.");
    if (weekly && !days.length) throw new FlowError("Tick at least one weekday.");
    if (!(end > start)) throw new FlowError("The end time must be after the start time.");
    if (!CLOSURE_CATEGORIES.includes(category as (typeof CLOSURE_CATEGORIES)[number])) throw new FlowError("Choose a reason.");
    const c: ClosureDraft = {
      court_ids: courts, starts_on: from, ends_on: weekly && noEnd ? null : to, repeat_days: weekly ? days : null,
      all_day: allDay, start_hour: start, end_hour: end, category, note: s(fd, "note"),
    };
    const r = await applyClosure(a, c);
    return `Closed${r.cancelled ? `. ${r.cancelled} booking(s) cancelled and customers emailed.` : "."}`;
  });
}
export async function reopenClosureAction(fd: FormData) {
  const a = await assertAdmin({ superOnly: true });
  return act("/admin/closures", async () => {
    const c = must(await db().from("closures").select("*").eq("id", s(fd, "id")).single()) as { category: string; note: string; starts_on: string };
    must(await db().from("closures").delete().eq("id", s(fd, "id")));
    await logAction(a, "Reopened", c.category, c.starts_on);
    return "Reopened. Those hours can be booked again.";
  });
}

/** drag-to-reorder on the Payment Methods page: saves the whole order, no redirect */
export async function reorderPaymentMethodsAction(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  const a = await assertAdmin({ superOnly: true });
  const all = must(await db().from("payment_methods").select("id, name").eq("branch_id", BRANCH_ID).eq("deleted", false).order("sort_order")) as { id: string; name: string }[];
  const next = ids.map((id) => all.find((m) => m.id === id)).filter((m): m is { id: string; name: string } => !!m);
  if (next.length !== all.length) return { ok: false, error: "The list changed. Reload the page and try again." };
  const before = all.map((m) => m.name).join(", "), after = next.map((m) => m.name).join(", ");
  if (before === after) return { ok: true };
  for (const [n, m] of next.entries()) must(await db().from("payment_methods").update({ sort_order: n + 1 }).eq("id", m.id));
  await logAction(a, "Payment methods reordered", "", `${before} → ${after}`);
  revalidatePath("/admin/payment-methods");
  return { ok: true };
}

export async function paymentMethodAction(fd: FormData) {
  const a = await assertAdmin({ superOnly: true });
  return act("/admin/payment-methods", async () => {
    const id = s(fd, "id"), op = s(fd, "op");
    if (op === "toggle" || op === "delete") {
      const m = must(await db().from("payment_methods").select("*").eq("id", id).single()) as { name: string; active: boolean };
      if (op === "toggle") {
        must(await db().from("payment_methods").update({ active: !m.active }).eq("id", id));
        await logAction(a, m.active ? "Payment method hidden" : "Payment method shown", m.name);
        return `${m.name} is now ${m.active ? "hidden from" : "shown to"} customers.`;
      }
      must(await db().from("payment_methods").update({ deleted: true, active: false }).eq("id", id));
      await logAction(a, "Payment method deleted", m.name);
      return `${m.name} deleted.`;
    }
    if (op === "move") {
      const all = must(await db().from("payment_methods").select("id, name, sort_order").eq("branch_id", BRANCH_ID).eq("deleted", false).order("sort_order")) as { id: string; name: string }[];
      const i = all.findIndex((m) => m.id === id), j = i + Number(s(fd, "dir"));
      if (i < 0 || j < 0 || j >= all.length) return "Order unchanged.";
      const before = all.map((m) => m.name).join(", ");
      [all[i], all[j]] = [all[j], all[i]];
      for (const [n, m] of all.entries()) await db().from("payment_methods").update({ sort_order: n + 1 }).eq("id", m.id);
      await logAction(a, "Payment methods reordered", "", `${before} → ${all.map((m) => m.name).join(", ")}`);
      return "Order saved.";
    }
    const name = s(fd, "name"), details = s(fd, "details");
    if (!name) throw new FlowError("Enter a name, e.g. GCash.");
    if (!details) throw new FlowError("Enter the payment details customers need.");
    const dup = must(await db().from("payment_methods").select("id").eq("branch_id", BRANCH_ID).eq("deleted", false).ilike("name", name)) as { id: string }[];
    if (dup.some((d) => d.id !== id)) throw new FlowError("Another payment method already uses this name.");
    const row: Record<string, unknown> = { name, details, active: fd.get("active") === "on" };
    const qr = fd.get("qr");
    if (qr instanceof File && qr.size) Object.assign(row, await uploadQr(qr).then((u) => ({ qr_path: u.path, qr_url: u.url })));
    if (fd.get("removeQr") === "on") Object.assign(row, { qr_path: null, qr_url: null });
    if (id) {
      must(await db().from("payment_methods").update(row).eq("id", id));
      await logAction(a, "Payment method edited", name);
      return `${name} saved.`;
    }
    const last = must(await db().from("payment_methods").select("sort_order").eq("branch_id", BRANCH_ID).order("sort_order", { ascending: false }).limit(1)) as { sort_order: number }[];
    must(await db().from("payment_methods").insert({ ...row, branch_id: BRANCH_ID, sort_order: (last[0]?.sort_order ?? 0) + 1 }));
    await logAction(a, "Payment method added", name);
    return `${name} added.`;
  });
}

const UNITS = ["hour", "session"] as const;
const money = (v: string) => (/^\d+$/.test(v) ? Number(v) : NaN);
const unitOf = (v: string) => ((UNITS as readonly string[]).includes(v) ? (v as (typeof UNITS)[number]) : null);

/* Management → Equipment Inventory (spec §7, v6.05): one Save for every item's name, price, per hour / per session, owned and out of service */
export async function inventoryAction(fd: FormData) {
  const a = await assertAdmin({ superOnly: true });
  return act("/admin/inventory", async () => {
    const items = must(await db().from("equipment_items").select("id, name, deleted")) as { id: string; name: string; deleted: boolean | null }[];
    const live = items.filter((i) => !i.deleted && fd.has(`own-${i.id}`));
    const names = new Set<string>();
    for (const { id } of live) {
      const name = s(fd, `name-${id}`), rate = money(s(fd, `rate-${id}`)), unit = unitOf(s(fd, `unit-${id}`));
      const owned = Number(s(fd, `own-${id}`)), out = Number(s(fd, `out-${id}`));
      if (!name) throw new FlowError("Every item needs a name.");
      if (names.has(name.toLowerCase())) throw new FlowError(`Two items are called "${name}". Give each item its own name.`);
      names.add(name.toLowerCase());
      if (!Number.isInteger(rate) || rate < 0) throw new FlowError(`Check the price of ${name}: whole pesos, 0 or more.`);
      if (!unit) throw new FlowError(`Choose per hour or per session for ${name}.`);
      if (!Number.isInteger(owned) || !Number.isInteger(out) || owned < 0 || out < 0 || out > owned) throw new FlowError("Check the numbers: out of service cannot be more than owned.");
      must(await db().from("equipment_items").update({ name, rate, unit }).eq("id", id));
      must(await db().from("inventory").upsert({ branch_id: BRANCH_ID, item_id: id, owned, out_of_service: out }, { onConflict: "branch_id,item_id" }));
    }
    await logAction(a, "Inventory updated");
    return "Inventory saved.";
  });
}

/* delete a rental item (spec §7, v6.05): it is hidden from customers and admins; past bookings keep showing its name.
   The class rental items (racket, paddle) can't be deleted: class registrations rent them.
   Bound to the item id by the Delete button (a button inside the Save form can't carry its own name/value with a function formAction). */
export async function deleteRentalItemAction(id: string) {
  const a = await assertAdmin({ superOnly: true });
  return act("/admin/inventory", async () => {
    if (Object.values(RENT_ITEM).includes(id)) throw new FlowError("This item is rented with classes, so it can't be deleted. Set its owned count to 0 to stop offering it.");
    const it = must(await db().from("equipment_items").select("name").eq("id", id).single()) as { name: string };
    must(await db().from("equipment_items").update({ deleted: true }).eq("id", id));
    await logAction(a, "Rental item deleted", it.name);
    return `${it.name} deleted. Customers can no longer rent it.`;
  });
}

/* add a rental item (spec §7, v6.05) */
export async function rentalItemAction(fd: FormData) {
  const a = await assertAdmin({ superOnly: true });
  return act("/admin/inventory", async () => {
    const name = s(fd, "name"), type = s(fd, "type"), rate = money(s(fd, "rate")), unit = unitOf(s(fd, "unit")), owned = Number(s(fd, "owned") || "0");
    if (!name) throw new FlowError("Enter the item's name, e.g. Tennis Racket.");
    if (type !== "tennis" && type !== "pickle") throw new FlowError("Choose the sport this item is for.");
    if (!Number.isInteger(rate) || rate < 0) throw new FlowError("Enter the price in whole pesos (0 or more).");
    if (!unit) throw new FlowError("Choose per hour or per session.");
    if (!Number.isInteger(owned) || owned < 0) throw new FlowError("Enter how many you own (0 or more).");
    const all = must(await db().from("equipment_items").select("id, name, deleted, sort_order")) as { id: string; name: string; deleted: boolean | null; sort_order: number }[];
    if (all.some((i) => !i.deleted && i.name.toLowerCase() === name.toLowerCase())) throw new FlowError("Another item already uses this name.");
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "item";
    let id = base;
    for (let n = 2; all.some((i) => i.id === id); n++) id = `${base}-${n}`;
    must(await db().from("equipment_items").insert({ id, name, type, rate, unit, sort_order: Math.max(0, ...all.map((i) => i.sort_order)) + 1 }));
    must(await db().from("inventory").insert({ branch_id: BRANCH_ID, item_id: id, owned, out_of_service: 0 }));
    await logAction(a, "Rental item added", name, `₱${rate} per item, per ${unit}`);
    return `${name} added.`;
  });
}

/* Management → Blacklist (spec §7, v6.13): add a person (full name, phone, email: at least one; note optional) or remove one */
export async function blacklistAction(fd: FormData) {
  const a = await assertAdmin({ superOnly: true });
  return act("/admin/blacklist", async () => {
    const remove = s(fd, "remove");
    if (remove) {
      const e = must(await db().from("blacklist").select("name, phone, email").eq("id", remove).single()) as { name: string; phone: string; email: string };
      must(await db().from("blacklist").delete().eq("id", remove));
      const who = e.name || e.email || e.phone;
      await logAction(a, "Removed from blacklist", who);
      return `${who} removed from the blacklist.`;
    }
    const name = s(fd, "name").replace(/\s+/g, " "), phone = s(fd, "phone"), email = s(fd, "email").toLowerCase(), note = s(fd, "note");
    if (!name && !phone && !email) throw new FlowError("Enter at least a full name, phone number or email.");
    if (name.length > 120 || phone.length > 40 || email.length > 200 || note.length > 500) throw new FlowError("One of the details is too long.");
    if (phone && normPhone(phone).length < 7) throw new FlowError("Check the phone number.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new FlowError("Check the email address.");
    must(await db().from("blacklist").insert({ branch_id: BRANCH_ID, name, phone, email, note, added_by: a.name }));
    const who = name || email || phone;
    await logAction(a, "Added to blacklist", who, [phone, email, note].filter(Boolean).join(" · "));
    return `${who} added to the blacklist.`;
  });
}
