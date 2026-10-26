import "server-only";
import { BRANCH_ID } from "./config";
import { db, must } from "./supabase";
import type { Booking, Order, RequestStatus } from "./types";

export type BookingRow = Booking & { orders: Order };

/** bookings with their order, newest submitted first (spec §7 v4.54) */
export async function listBookings(f: { status?: RequestStatus; date?: string; from?: string; to?: string } = {}): Promise<BookingRow[]> {
  let q = db().from("bookings").select("*, orders(*)").eq("branch_id", BRANCH_ID);
  if (f.status) q = q.eq("status", f.status);
  if (f.date) q = q.eq("date", f.date);
  if (f.from) q = q.gte("date", f.from);
  if (f.to) q = q.lte("date", f.to);
  return must(await q.order("created_at", { ascending: false }).order("date", { ascending: false }).limit(2000)) as BookingRow[];
}

/** open-stage bookings grouped by order: one approval per order (spec §7 Orders) */
export function groupByOrder(l: BookingRow[]): BookingRow[][] {
  const m = new Map<string, BookingRow[]>();
  for (const b of l) m.set(b.order_id, [...(m.get(b.order_id) ?? []), b]);
  return [...m.values()].map((g) => g.sort((a, b) => (a.date + String(a.hours[0]).padStart(2, "0")).localeCompare(b.date + String(b.hours[0]).padStart(2, "0"))));
}

export async function getBooking(id: string): Promise<BookingRow | null> {
  return (await db().from("bookings").select("*, orders(*)").eq("id", id).eq("branch_id", BRANCH_ID).maybeSingle()).data as BookingRow | null;
}
