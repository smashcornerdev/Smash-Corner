import { weekday, addDaysKey, dayDiff } from "./time";
import type { Closure } from "./types";

export const NO_END = "9999-12-31";
const WDN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** the closure applies on this date (range + weekly repeat) */
export function closureOn(c: Closure, date: string): boolean {
  const end = c.ends_on ?? NO_END;
  if (date < c.starts_on || date > end) return false;
  return !c.repeat_days || !c.repeat_days.length || c.repeat_days.includes(weekday(date));
}
export function closureCovers(c: Closure, courtId: string, date: string, h: number): boolean {
  return c.court_ids.includes(courtId) && closureOn(c, date) && h >= c.start_hour && h < c.end_hour;
}
/** number of closure days between a and b (inclusive) */
export function closureDaysIn(c: Closure, a: string, b: string): number {
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
export function closedHoursIn(closures: Closure[], from: string, to: string, courtId: string | "all"): number {
  let n = 0;
  for (const c of closures) {
    const days = closureDaysIn(c, from, to);
    if (!days) continue;
    for (const id of c.court_ids) if (courtId === "all" || id === courtId) n += days * (c.end_hour - c.start_hour);
  }
  return n;
}
export const closureDatesText = (c: Closure, fmt: (k: string) => string) =>
  c.repeat_days && c.repeat_days.length
    ? "Every " + [1, 2, 3, 4, 5, 6, 0].filter((d) => c.repeat_days!.includes(d)).map((d) => WDN[d]).join(", ") +
      " · from " + fmt(c.starts_on) + (c.ends_on ? " until " + fmt(c.ends_on) : " (no end date)")
    : c.starts_on === c.ends_on ? fmt(c.starts_on) : fmt(c.starts_on) + " – " + fmt(c.ends_on ?? c.starts_on);
export const closureReason = (c: Pick<Closure, "category" | "note">) => c.category + (c.note ? ": " + c.note : "");
