/* Dates are Manila-local "YYYY-MM-DD" keys; hours are integers 7–22. Manila has no DST (UTC+8). */
import { CLOSE_HOUR, OPEN_HOUR, REMIND_HOURS } from "./config";

const OFFSET_MS = 8 * 3600e3;
const pad = (n: number) => String(n).padStart(2, "0");

/** current wall-clock time in Manila, as a Date whose UTC fields hold Manila values */
const manilaNow = () => new Date(Date.now() + OFFSET_MS);

export function todayKey(): string {
  const d = manilaNow();
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
export function manilaHour(): number {
  return manilaNow().getUTCHours();
}
export function parseKey(k: string): { y: number; m: number; d: number } {
  const [y, m, d] = k.split("-").map(Number);
  return { y, m, d };
}
/** weekday 0 Sun … 6 Sat */
export function weekday(k: string): number {
  const { y, m, d } = parseKey(k);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
export function addDaysKey(k: string, n: number): string {
  const { y, m, d } = parseKey(k);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
export function dayDiff(a: string, b: string): number {
  const pa = parseKey(a), pb = parseKey(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400e3);
}
/** last bookable day: same date next month (spec §6 Step 2) */
export function maxBookKey(): string {
  const { y, m, d } = parseKey(todayKey());
  const t = new Date(Date.UTC(y, m, d));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
/** epoch ms of an hour on a Manila date */
export function hourTs(k: string, h: number): number {
  const { y, m, d } = parseKey(k);
  return Date.UTC(y, m - 1, d, h) - OFFSET_MS;
}
/** starts within the reminder window (spec §10): reminder due, or the confirmation already covers it */
export function withinReminder(k: string, h: number): boolean {
  return hourTs(k, h) - Date.now() <= REMIND_HOURS * 3600e3;
}
/** the slot has started (or the day is over) */
export function slotStarted(k: string, h: number): boolean {
  return hourTs(k, h) <= Date.now();
}
export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/* ---------- formatting: mm/dd/yyyy everywhere (spec §15) ---------- */
export function fmtDate(k: string): string {
  const { y, m, d } = parseKey(k);
  return `${pad(m)}/${pad(d)}/${y}`;
}
const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function fmtDateLong(k: string): string {
  return `${WD[weekday(k)]}, ${fmtDate(k)}`;
}
export function fmtMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-PH", { month: "long", year: "numeric", timeZone: "UTC" });
}
export function fmtH(h: number): string {
  const x = h % 12 || 12;
  return `${x}:00 ${h >= 12 && h < 24 ? "PM" : "AM"}`;
}
/** contiguous runs of hours, e.g. [7,8,9,13] → [[7,9],[13,13]] */
export function toRanges(hours: number[]): [number, number][] {
  const s = [...hours].sort((a, b) => a - b);
  const out: [number, number][] = [];
  for (const h of s) {
    const last = out[out.length - 1];
    if (last && h === last[1] + 1) last[1] = h;
    else out.push([h, h]);
  }
  return out;
}
export function fmtRange(hours: number[]): string {
  return toRanges(hours).map(([a, b]) => `${fmtH(a)} – ${fmtH(b + 1)}`).join(", ");
}
export function fmtTs(ts: string | number | Date): string {
  const d = new Date(new Date(ts).getTime() + OFFSET_MS);
  const h = d.getUTCHours(), mi = d.getUTCMinutes();
  return `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}/${d.getUTCFullYear()} ${h % 12 || 12}:${pad(mi)} ${h >= 12 ? "PM" : "AM"}`;
}
export function ago(ts: string | number | Date): string {
  const m = Math.round((Date.now() - new Date(ts).getTime()) / 60e3);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}
export const isValidHour = (h: number) => Number.isInteger(h) && h >= OPEN_HOUR && h < CLOSE_HOUR;
