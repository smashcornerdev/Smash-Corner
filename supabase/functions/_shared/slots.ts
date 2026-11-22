/* Slot states (spec §6 Step 3, §14), shared by the website's availability (src/lib/availability.ts) and the tick Edge
   Function's waitlist hand-off, so both agree on whether an hour is free. Imports only other _shared files. */
import { closureOn, type ReportClosure } from "./report.ts";
import { slotStarted } from "./time.ts";

export type SlotState = "past" | "closed" | "class" | "taken" | "reserved" | "cart" | "open";
export type SlotClass = { court_id: string; date: string; start_hour: number; end_hour: number };
export type LockRow = {
  court_id: string; date: string; hour: number; booking_id: string | null; hold_id: string | null; waitlist_id: string | null;
  holds: { session_id: string; expires_at: string } | null;
};
export type SlotCtx = { closures: ReportClosure[]; classes: SlotClass[]; locks: LockRow[]; session: string | null; claim: string | null };

/** the columns the slot-lock query must select (with the hold it belongs to) */
export const LOCK_COLUMNS = "court_id, date, hour, booking_id, hold_id, waitlist_id, holds(session_id, expires_at)";

export const closureCovers = (c: ReportClosure, courtId: string, date: string, h: number) =>
  c.court_ids.includes(courtId) && closureOn(c, date) && h >= c.start_hour && h < c.end_hour;

export function stateOf(ctx: SlotCtx, courtId: string, date: string, h: number): SlotState {
  if (slotStarted(date, h)) return "past";
  if (ctx.closures.some((c) => closureCovers(c, courtId, date, h))) return "closed";
  if (ctx.classes.some((k) => k.court_id === courtId && k.date === date && h >= k.start_hour && h < k.end_hour)) return "class";
  const lock = ctx.locks.find((l) => l.court_id === courtId && l.date === date && l.hour === h);
  if (!lock) return "open";
  if (lock.booking_id) return "taken";
  if (lock.hold_id) {
    if (!lock.holds || new Date(lock.holds.expires_at).getTime() <= Date.now()) return "open"; // expired hold
    return lock.holds.session_id === ctx.session ? "cart" : "reserved";
  }
  if (lock.waitlist_id) return lock.waitlist_id === ctx.claim ? "open" : "reserved";
  return "open";
}
