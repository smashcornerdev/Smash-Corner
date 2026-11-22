import "server-only";
import { env } from "./env";
import { db, must } from "./supabase";
import { getAllEquipment, getCourts } from "./catalog";
import { classRecord, courtRecord } from "./records";
import { fmtDate } from "./time";
import type { BookingRow } from "./adminData";
import type { ClassReg, ClassRow } from "./types";

/* Google Sheets recording (spec §7 Google Sheets Sync). The flows call these right after a record changes; the
   record-to-sheets Supabase Edge Function writes or removes the row. A Google problem is logged and never fails the
   admin's action: the booking itself is already saved. Off when SHEETS_SECRET isn't set. */
type Tab = "court" | "class";

async function send(tab: Tab, rows: (string | number)[][], remove: string[] = []) {
  const secret = env.sheetsSecret();
  if (!secret || (!rows.length && !remove.length)) return;
  try {
    const { data, error } = await db().functions.invoke("record-to-sheets", { body: { tab, rows, remove }, headers: { "x-sheets-secret": secret } });
    if (error) throw error;
    if (data && data.success === false) throw new Error(data.error);
  } catch (e) {
    console.error(`Google Sheets recording failed (${tab}: ${[...rows.map((r) => r[0]), ...remove].join(", ")}):`, e);
  }
}

const cells = (r: unknown[]) => r.map((v) => (v instanceof Date ? fmtDate(v.toISOString().slice(0, 10)) : (v as string | number)));

/** write the rows of these court bookings (call after they are approved or edited) */
export async function recordBookings(ids: string[]) {
  if (!ids.length || !env.sheetsSecret()) return;
  try {
    const [courts, items, rows] = await Promise.all([getCourts(), getAllEquipment(), db().from("bookings").select("*, orders(*)").in("id", ids).eq("status", "approved")]);
    const name = (id: string) => courts.find((c) => c.id === id)?.name ?? id;
    await send("court", (must(rows) as BookingRow[]).map((b) => cells(courtRecord(b, name, items, fmtDate))));
  } catch (e) {
    console.error("Google Sheets recording failed (court):", e);
  }
}

/** write the rows of these class registrations (call after they are approved) */
export async function recordRegs(ids: string[]) {
  if (!ids.length || !env.sheetsSecret()) return;
  try {
    const [courts, rows] = await Promise.all([getCourts(), db().from("class_registrations").select("*, classes(*)").in("id", ids).eq("status", "approved")]);
    const name = (id: string) => courts.find((c) => c.id === id)?.name ?? id;
    await send("class", (must(rows) as (ClassReg & { classes: ClassRow })[]).map((r) => cells(classRecord(r, r.classes, name, fmtDate))));
  } catch (e) {
    console.error("Google Sheets recording failed (class):", e);
  }
}

/** remove the rows of records that stopped being approved (cancelled) */
export const unrecord = (tab: Tab, refs: string[]) => send(tab, [], refs);
