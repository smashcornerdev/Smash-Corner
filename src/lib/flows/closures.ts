import "server-only";
import { BRANCH_ID } from "../config";
import { db, must } from "../supabase";
import { closureCovers, closureDatesText, closureReason, NO_END } from "../closures";
import { bookingViews } from "./views";
import { logAction } from "../log";
import { fmtDate, todayKey } from "../time";
import { courtById, getCourts } from "../catalog";
import { mailClosureCancelled, mailWaitlistClosed } from "../email/messages";
import type { Admin, Booking, Closure, WaitlistEntry } from "../types";

/* Closures (spec §7): closed hours can't be booked; bookings already there are cancelled with a full refund. */
export type ClosureDraft = Pick<Closure, "court_ids" | "starts_on" | "ends_on" | "repeat_days" | "all_day" | "start_hour" | "end_hour" | "category" | "note">;

const asClosure = (c: ClosureDraft): Closure => ({ ...c, id: "", cancelled_count: 0, created_by: "", created_at: "" });

export async function closureImpact(c: ClosureDraft) {
  const end = c.ends_on ?? NO_END;
  const from = c.starts_on > todayKey() ? c.starts_on : todayKey();
  const full = asClosure(c);
  const bookings = (must(await db().from("bookings").select("*").eq("branch_id", BRANCH_ID).in("court_id", c.court_ids)
    .gte("date", from).lte("date", end).in("status", ["pending", "awaiting", "verify", "approved"])) as Booking[])
    .filter((b) => b.hours.some((h) => closureCovers(full, b.court_id, b.date, h)));
  const waitlist = (must(await db().from("waitlist").select("*").eq("branch_id", BRANCH_ID).in("court_id", c.court_ids)
    .gte("date", from).lte("date", end).in("status", ["applied", "waiting", "notified"])) as WaitlistEntry[])
    .filter((w) => closureCovers(full, w.court_id, w.date, w.hour));
  return { bookings, waitlist };
}

export async function applyClosure(admin: Admin, c: ClosureDraft): Promise<{ cancelled: number }> {
  const { bookings, waitlist } = await closureImpact(c);
  const label = closureReason(c);
  const created = must(await db().from("closures").insert({ ...c, branch_id: BRANCH_ID, created_by: admin.name, cancelled_count: bookings.length }).select().single()) as Closure;
  for (const b of bookings) {
    const paid = b.status === "verify" || b.status === "approved";
    must(await db().from("bookings").update({ status: "cancelled", reason: `Court closed (${label})`, refund_pct: paid ? 100 : null }).eq("id", b.id));
    await logAction(admin, "Cancelled (closure)", b.ref, label);
    await mailClosureCancelled(b, (await bookingViews([b]))[0], label, paid);
  }
  for (const w of waitlist) {
    await db().from("waitlist").update({ status: "removed" }).eq("id", w.id);
    await db().from("slot_locks").delete().eq("waitlist_id", w.id);
    await mailWaitlistClosed(w, { court: (await courtById(w.court_id))?.name ?? w.court_id, date: w.date, hour: w.hour }, label);
  }
  // cart holds on closed hours are dropped
  const holds = must(await db().from("holds").select("id, court_id, date, hours").in("court_id", c.court_ids).gte("date", c.starts_on)) as { id: string; court_id: string; date: string; hours: number[] }[];
  const hit = holds.filter((h) => h.hours.some((x) => closureCovers(created, h.court_id, h.date, x))).map((h) => h.id);
  if (hit.length) await db().from("holds").delete().in("id", hit);
  const courts = await getCourts();
  const names = c.court_ids.length === courts.length ? "All courts" : c.court_ids.map((id) => courts.find((x) => x.id === id)?.name ?? id).join(", ");
  await logAction(admin, "Closed courts", names, `${closureDatesText(created, fmtDate)} · ${label}${bookings.length ? ` · ${bookings.length} booking(s) cancelled` : ""}`);
  return { cancelled: bookings.length };
}
