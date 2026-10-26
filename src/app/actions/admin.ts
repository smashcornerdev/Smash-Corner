"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { BRANCH_ID, CLOSE_HOUR, CLOSURE_CATEGORIES, OPEN_HOUR } from "@/lib/config";
import { db, must } from "@/lib/supabase";
import { logAction } from "@/lib/log";
import { uploadQr } from "@/lib/storage";
import { hourTs } from "@/lib/time";
import { FlowError, approve, cancel, edit, reject } from "@/lib/flows/bookings";
import { approveReg, cancelClass, rejectReg } from "@/lib/flows/classes";
import { applyClosure, type ClosureDraft } from "@/lib/flows/closures";
import { approveEntry, declineEntry, notifyWaitlist, processSlot } from "@/lib/flows/waitlist";
import { dayStates } from "@/lib/availability";
import type { WaitlistEntry } from "@/lib/types";

/* All admin mutations. Each one re-checks the signed-in admin (and role) on the server (spec §7 Access). */

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
export async function openClassAction(fd: FormData) {
  const a = await assertAdmin();
  return act("/admin/classes", async () => {
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
  });
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

export async function inventoryAction(fd: FormData) {
  const a = await assertAdmin({ superOnly: true });
  return act("/admin/inventory", async () => {
    const items = must(await db().from("inventory").select("item_id").eq("branch_id", BRANCH_ID)) as { item_id: string }[];
    for (const { item_id } of items) {
      const owned = Number(s(fd, `own-${item_id}`)), out = Number(s(fd, `out-${item_id}`));
      if (!Number.isInteger(owned) || !Number.isInteger(out) || owned < 0 || out < 0 || out > owned) throw new FlowError("Check the numbers: out of service cannot be more than owned.");
      must(await db().from("inventory").update({ owned, out_of_service: out }).eq("branch_id", BRANCH_ID).eq("item_id", item_id));
    }
    await logAction(a, "Inventory updated");
    return "Inventory saved.";
  });
}
