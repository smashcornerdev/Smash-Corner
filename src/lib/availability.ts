import "server-only";
import { BRANCH_ID, HOURS } from "./config";
import { db, must } from "./supabase";
import { closureCovers } from "./closures";
import { addDaysKey, maxBookKey, slotStarted, todayKey } from "./time";
import { getInventory } from "./catalog";
import type { ClassRow, Closure, Equipment } from "./types";

/* Slot states shown in the time grid (spec §6 Step 3, §14) */
export type SlotState = "past" | "closed" | "class" | "taken" | "reserved" | "cart" | "open";

type LockRow = {
  court_id: string; date: string; hour: number; booking_id: string | null; hold_id: string | null; waitlist_id: string | null;
  holds: { session_id: string; expires_at: string } | null;
};

export async function getClosures(): Promise<Closure[]> {
  return must(await db().from("closures").select("*").eq("branch_id", BRANCH_ID)) as Closure[];
}
export async function getLiveClasses(from: string, to: string, courtId?: string): Promise<ClassRow[]> {
  let q = db().from("classes").select("*").eq("branch_id", BRANCH_ID).neq("status", "cancelled").gte("date", from).lte("date", to);
  if (courtId) q = q.eq("court_id", courtId);
  return must(await q) as ClassRow[];
}
async function getLocks(courtId: string, from: string, to: string): Promise<LockRow[]> {
  return must(await db().from("slot_locks").select("court_id, date, hour, booking_id, hold_id, waitlist_id, holds(session_id, expires_at)")
    .eq("court_id", courtId).gte("date", from).lte("date", to)) as unknown as LockRow[];
}

type Ctx = { closures: Closure[]; classes: ClassRow[]; locks: LockRow[]; session: string | null; claim: string | null };

function stateOf(ctx: Ctx, courtId: string, date: string, h: number): SlotState {
  if (slotStarted(date, h)) return "past";
  if (ctx.closures.some((c) => closureCovers(c, courtId, date, h))) return "closed";
  if (ctx.classes.some((k) => k.court_id === courtId && k.date === date && h >= k.start_hour && h < k.end_hour)) return "class";
  const lock = ctx.locks.find((l) => l.date === date && l.hour === h);
  if (!lock) return "open";
  if (lock.booking_id) return "taken";
  if (lock.hold_id) {
    if (!lock.holds || new Date(lock.holds.expires_at).getTime() <= Date.now()) return "open"; // expired hold
    return lock.holds.session_id === ctx.session ? "cart" : "reserved";
  }
  if (lock.waitlist_id) return lock.waitlist_id === ctx.claim ? "open" : "reserved";
  return "open";
}

async function context(courtId: string, from: string, to: string, session: string | null, claim: string | null): Promise<Ctx> {
  const [closures, classes, locks] = await Promise.all([getClosures(), getLiveClasses(from, to, courtId), getLocks(courtId, from, to)]);
  return { closures, classes, locks, session, claim };
}

/** hour → state for one court and date */
export async function dayStates(courtId: string, date: string, session: string | null, claim: string | null = null) {
  const ctx = await context(courtId, date, date, session, claim);
  const out: Record<number, SlotState> = {};
  for (const h of HOURS) out[h] = stateOf(ctx, courtId, date, h);
  return out;
}

export type DaySummary = { date: string; open: number; closed: boolean; bookable: boolean };
/** per-day open-hour counts for the month calendar (bookable window only) */
export async function monthSummary(courtId: string, month: string, session: string | null, claim: string | null = null): Promise<DaySummary[]> {
  const t0 = todayKey(), max = maxBookKey();
  const first = `${month}-01`;
  const from = first < t0 ? t0 : first;
  const ctx = await context(courtId, from, max, session, claim);
  const out: DaySummary[] = [];
  for (let d = first; d.slice(0, 7) === month; d = addDaysKey(d, 1)) {
    const bookable = d >= t0 && d <= max;
    if (!bookable) { out.push({ date: d, open: 0, closed: false, bookable }); continue; }
    const st = HOURS.map((h) => stateOf(ctx, courtId, d, h));
    out.push({ date: d, open: st.filter((s) => s === "open").length, closed: st.every((s) => s === "closed" || s === "past"), bookable });
  }
  return out;
}

/** free quantity of an item for every hour of a slot range (bookings + live cart holds count) */
export async function equipmentFree(date: string, hours: number[], opts: { excludeBooking?: string; excludeHold?: string } = {}) {
  const [inv, bookings, holds] = await Promise.all([
    getInventory(),
    db().from("bookings").select("id, hours, equipment").eq("branch_id", BRANCH_ID).eq("date", date).in("status", ["pending", "awaiting", "verify", "approved"]),
    db().from("holds").select("id, hours, equipment").eq("branch_id", BRANCH_ID).eq("date", date).gt("expires_at", new Date().toISOString()),
  ]);
  const rows = [
    ...((must(bookings) as { id: string; hours: number[]; equipment: Equipment }[]).filter((b) => b.id !== opts.excludeBooking)),
    ...((must(holds) as { id: string; hours: number[]; equipment: Equipment }[]).filter((x) => x.id !== opts.excludeHold)),
  ];
  const free: Record<string, number> = {};
  for (const it of inv) {
    const cap = Math.max(0, it.owned - it.out_of_service);
    free[it.item_id] = hours.length
      ? Math.max(0, Math.min(...hours.map((h) => cap - rows.reduce((n, r) => n + (r.hours.includes(h) ? r.equipment[it.item_id] || 0 : 0), 0))))
      : cap;
  }
  return free;
}
