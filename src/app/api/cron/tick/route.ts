import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { db } from "@/lib/supabase";
import { expireUnpaidOrders, remindUpcoming } from "@/lib/flows/bookings";
import { expireUnpaidRegs, remindUpcomingRegs } from "@/lib/flows/classes";
import { expireWaitlist, releaseHours } from "@/lib/flows/waitlist";
import type { Hold } from "@/lib/types";

/* Every minute (Supabase pg_cron → pg_net, see supabase/migrations/0002_cron.sql, spec §18 Scheduled jobs):
   expire cart holds and waitlist claims, expire requests not paid within 24 h, email the next person in line,
   remind customers 24 h before a confirmed booking or class. */
export async function POST(req: NextRequest) {
  const got = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "");
  const want = Buffer.from(env.cronSecret());
  if (got.length !== want.length || !timingSafeEqual(got, want)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // cart holds past their 15 minutes: delete (locks cascade) and offer the hours to the waitlist
  const { data: expired } = await db().from("holds").delete().lte("expires_at", new Date().toISOString()).select("court_id, date, hours, waitlist_id");
  for (const h of (expired ?? []) as Pick<Hold, "court_id" | "date" | "hours" | "waitlist_id">[]) {
    if (h.waitlist_id) await db().from("waitlist").update({ status: "expired" }).eq("id", h.waitlist_id).eq("status", "notified");
    await releaseHours(h.court_id, h.date, h.hours);
  }
  const claims = await expireWaitlist();
  const orders = await expireUnpaidOrders();
  const regs = await expireUnpaidRegs();
  const reminders = (await remindUpcoming()) + (await remindUpcomingRegs());
  return NextResponse.json({ holds: expired?.length ?? 0, claims, orders, regs, reminders });
}
