import { NextResponse, type NextRequest } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { BRANCH_ID } from "@/lib/config";
import { db, must } from "@/lib/supabase";
import { getCourts } from "@/lib/catalog";
import { getClosures } from "@/lib/availability";
import { closureOn } from "@/lib/closures";
import { addDaysKey, toRanges } from "@/lib/time";
import type { Booking, ClassRow, WaitlistEntry } from "@/lib/types";

const iso = (d: string, h: number) => `${d}T${String(h).padStart(2, "0")}:00:00+08:00`;
const label: Record<string, string> = { pending: "pending", awaiting: "awaiting payment", verify: "verifying payment" };

/* FullCalendar feed (spec §7 Calendar): bookings, classes, waitlist holds and closures */
export async function GET(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "No access" }, { status: 403 }); }
  const start = (req.nextUrl.searchParams.get("start") ?? "").slice(0, 10), end = (req.nextUrl.searchParams.get("end") ?? "").slice(0, 10);
  const court = req.nextUrl.searchParams.get("court") ?? "all";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return NextResponse.json([], { status: 400 });
  const [courts, bookings, classes, waits, closures] = await Promise.all([
    getCourts(),
    db().from("bookings").select("*").eq("branch_id", BRANCH_ID).gte("date", start).lt("date", end).in("status", ["pending", "awaiting", "verify", "approved"]).then((r) => must(r) as Booking[]),
    db().from("classes").select("*").eq("branch_id", BRANCH_ID).neq("status", "cancelled").gte("date", start).lt("date", end).then((r) => must(r) as ClassRow[]),
    db().from("waitlist").select("*").eq("branch_id", BRANCH_ID).eq("status", "notified").gte("date", start).lt("date", end).then((r) => must(r) as WaitlistEntry[]),
    getClosures(),
  ]);
  const short = (id: string) => (courts.find((c) => c.id === id)?.name ?? id).replace(" Court", "");
  const want = (id: string) => court === "all" || court === id;
  const out: unknown[] = [];
  for (const b of bookings.filter((x) => want(x.court_id))) {
    const st = b.status === "approved" ? "approved" : "pending";
    for (const [a, z] of toRanges(b.hours)) out.push({
      id: `${b.id}-${a}`, title: `${b.name} · ${b.ref}`, start: iso(b.date, a), end: iso(b.date, z + 1), resourceId: b.court_id,
      classNames: ["ev", `ev-${b.court_id}`, `ev-${st}`], extendedProps: { href: `/admin/bookings/view/${b.id}`, court: short(b.court_id), extra: label[b.status] ?? "" },
    });
  }
  for (const k of classes.filter((x) => want(x.court_id))) out.push({
    id: `c-${k.id}`, title: `Class: ${k.title}`, start: iso(k.date, k.start_hour), end: iso(k.date, k.end_hour), resourceId: k.court_id,
    classNames: ["ev", `ev-${k.court_id}`, "ev-class"], extendedProps: { href: `/admin/classes/class/${k.id}`, court: short(k.court_id), extra: "" },
  });
  for (const w of waits.filter((x) => want(x.court_id))) out.push({
    id: `w-${w.id}`, title: `Held for waitlist: ${w.name}`, start: iso(w.date, w.hour), end: iso(w.date, w.hour + 1), resourceId: w.court_id,
    classNames: ["ev", "ev-hold"], extendedProps: { court: short(w.court_id), extra: "" },
  });
  for (const c of closures) for (let d = start; d < end; d = addDaysKey(d, 1)) {
    if (!closureOn(c, d)) continue;
    for (const id of c.court_ids.filter(want)) out.push({
      id: `x-${c.id}-${d}-${id}`, title: `Closed: ${c.category}`, start: iso(d, c.start_hour), end: iso(d, c.end_hour), resourceId: id,
      display: "background", classNames: ["ev-closed"], extendedProps: { closed: true },
    });
  }
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
