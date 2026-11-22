/* Reports maths (spec §19), shared by the Reports page (Next.js) and the monthly-report Edge Function (Deno), so the
   monthly email always shows the same numbers as the page. Imports only other _shared files.
   Dates are Manila "YYYY-MM-DD" keys. */
import { HOURS } from "./site.ts";
import { addDaysKey, dayDiff, weekday } from "./time.ts";

export const OPEN_HOURS = HOURS.length;
export const NO_END = "9999-12-31";

export type ReportClosure = { court_ids: string[]; starts_on: string; ends_on: string | null; repeat_days: number[] | null; start_hour: number; end_hour: number };
export type ReportBooking = { date: string; court_id: string; status: string; total: number; refund_pct: number | null; hours: number[] };
export type ReportReg = { status: string; total: number; refund_pct: number | null };

/* ---------- closures ---------- */
/** the closure applies on this date (range + weekly repeat) */
export function closureOn(c: ReportClosure, date: string): boolean {
  if (date < c.starts_on || date > (c.ends_on ?? NO_END)) return false;
  return !c.repeat_days || !c.repeat_days.length || c.repeat_days.includes(weekday(date));
}
/** number of closure days between a and b (inclusive) */
function closureDaysIn(c: ReportClosure, a: string, b: string): number {
  const x = c.starts_on > a ? c.starts_on : a;
  let y = (c.ends_on ?? NO_END) < b ? (c.ends_on as string) : b;
  if (x > y) return 0;
  const cap = addDaysKey(x, 3660);
  if (y > cap) y = cap;
  if (!c.repeat_days || !c.repeat_days.length) return dayDiff(x, y) + 1;
  let n = 0;
  for (let d = x; d <= y; d = addDaysKey(d, 1)) if (closureOn(c, d)) n++;
  return n;
}
export function closedHoursIn(closures: ReportClosure[], from: string, to: string, courtId: string | "all"): number {
  let n = 0;
  for (const c of closures) {
    const days = closureDaysIn(c, from, to);
    if (!days) continue;
    for (const id of c.court_ids) if (courtId === "all" || id === courtId) n += days * (c.end_hour - c.start_hour);
  }
  return n;
}

/* ---------- KPIs (spec §19 table) ---------- */
export function metrics<B extends ReportBooking>(all: B[], closures: ReportClosure[], from: string, to: string, cid: string, nCourts: number) {
  const L = all.filter((b) => b.date >= from && b.date <= to && (cid === "all" || b.court_id === cid));
  const appr = L.filter((b) => b.status === "approved"), canc = L.filter((b) => b.status === "cancelled" && b.refund_pct != null);
  const pend = L.filter((b) => ["pending", "awaiting", "verify"].includes(b.status));
  const paid = appr.length + canc.length;
  const gross = [...appr, ...canc].reduce((x, b) => x + b.total, 0);
  const refunds = canc.reduce((x, b) => x + Math.round((b.total * (b.refund_pct ?? 0)) / 100), 0);
  const net = gross - refunds;
  const days = dayDiff(from, to) + 1;
  const avail = Math.max(0, days * OPEN_HOURS * (cid === "all" ? nCourts : 1) - closedHoursIn(closures, from, to, cid));
  const occ = appr.reduce((x, b) => x + b.hours.length, 0);
  return { L, appr, gross, net, refunds, bookings: paid + pend.length, cancelled: canc.length, util: avail ? occ / avail : 0, cancelRate: paid ? canc.length / paid : 0, abv: paid ? gross / paid : 0, revpach: avail ? net / avail : 0, revpoch: occ ? net / occ : 0, occ, avail };
}

/** class registrations (monthly email's class section, v6.21): same revenue rules as court bookings */
export function classMetrics(regs: ReportReg[]) {
  const appr = regs.filter((r) => r.status === "approved"), canc = regs.filter((r) => r.status === "cancelled" && r.refund_pct != null);
  const gross = [...appr, ...canc].reduce((x, r) => x + r.total, 0);
  const refunds = canc.reduce((x, r) => x + Math.round((r.total * (r.refund_pct ?? 0)) / 100), 0);
  return { confirmed: appr.length, gross, refunds, net: gross - refunds };
}
