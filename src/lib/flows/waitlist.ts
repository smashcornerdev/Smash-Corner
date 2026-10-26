import "server-only";
import { BRANCH_ID, CLAIM_HOURS } from "../config";
import { db, must } from "../supabase";
import { dayStates } from "../availability";
import { courtById } from "../catalog";
import { claimUrl } from "../links";
import { logAction } from "../log";
import { mailSlotAvailable, mailWaitlistApproved, mailWaitlistDeclined } from "../email/messages";
import { slotStarted } from "../time";
import { FlowError } from "./bookings";
import type { Admin, WaitlistEntry } from "../types";

/* Waitlist hand-off (spec §9): customers apply, an admin approves them into the line (ordered by approval time),
   and when an hour frees up the first person in line gets a 2-hour claim link.
   The claim holds the hour with a slot lock owned by the waitlist entry. */
export async function processSlot(courtId: string, date: string, hour: number) {
  if (slotStarted(date, hour)) return;
  const states = await dayStates(courtId, date, null);
  if (states[hour] !== "open") return;
  const next = must(await db().from("waitlist").select("*").eq("branch_id", BRANCH_ID).eq("court_id", courtId).eq("date", date)
    .eq("hour", hour).eq("status", "waiting").order("approved_at").limit(1)) as WaitlistEntry[];
  if (next[0]) await notifyWaitlist(next[0]);
}

export async function notifyWaitlist(w: WaitlistEntry) {
  const expires = new Date(Date.now() + CLAIM_HOURS * 3600e3).toISOString();
  const lock = await db().from("slot_locks").insert({ court_id: w.court_id, date: w.date, hour: w.hour, waitlist_id: w.id });
  if (lock.error) return; // someone else took the hour in the meantime
  must(await db().from("waitlist").update({ status: "notified", claim_expires_at: expires }).eq("id", w.id));
  const court = await courtById(w.court_id);
  await mailSlotAvailable(w, { court: court?.name ?? w.court_id, date: w.date, hour: w.hour }, claimUrl(w.id, expires), expires, `claim:${w.id}`);
}

async function slotOf(w: WaitlistEntry) {
  return { court: (await courtById(w.court_id))?.name ?? w.court_id, date: w.date, hour: w.hour };
}

/** admin: applied → waiting (joins the back of the line); if the hour is already free, they are offered it right away */
export async function approveEntry(admin: Admin, id: string): Promise<string> {
  const w = (await db().from("waitlist").select("*").eq("id", id).eq("branch_id", BRANCH_ID).maybeSingle()).data as WaitlistEntry | null;
  if (!w || w.status !== "applied") throw new FlowError("This application can't be approved now.");
  if (slotStarted(w.date, w.hour)) throw new FlowError("This slot has already started.");
  must(await db().from("waitlist").update({ status: "waiting", approved_at: new Date().toISOString() }).eq("id", w.id));
  const line = must(await db().from("waitlist").select("id").eq("branch_id", BRANCH_ID).eq("court_id", w.court_id).eq("date", w.date)
    .eq("hour", w.hour).in("status", ["waiting", "notified"])) as unknown[];
  await mailWaitlistApproved(w, await slotOf(w), line.length, `wl-approved:${w.id}`);
  await logAction(admin, "Waitlist approved", `${w.court_id} ${w.date} ${w.hour}:00`, `${w.name} (#${line.length})`);
  await processSlot(w.court_id, w.date, w.hour);
  return `${w.name} approved and is #${line.length} in line.`;
}

/** admin: applied → declined */
export async function declineEntry(admin: Admin, id: string): Promise<string> {
  const w = (await db().from("waitlist").select("*").eq("id", id).eq("branch_id", BRANCH_ID).maybeSingle()).data as WaitlistEntry | null;
  if (!w || w.status !== "applied") throw new FlowError("This application can't be declined now.");
  must(await db().from("waitlist").update({ status: "declined" }).eq("id", w.id));
  await mailWaitlistDeclined(w, await slotOf(w), `wl-declined:${w.id}`);
  await logAction(admin, "Waitlist declined", `${w.court_id} ${w.date} ${w.hour}:00`, w.name);
  return `${w.name}'s waitlist application declined.`;
}

/** hours given back by a rejected / cancelled / unpaid / moved booking */
export async function releaseHours(courtId: string, date: string, hours: number[]) {
  for (const h of hours) await processSlot(courtId, date, h);
}

/** cron: expire unused claims (next person is emailed) and entries whose slot has started */
export async function expireWaitlist() {
  const now = new Date().toISOString();
  const lapsed = must(await db().from("waitlist").select("*").eq("branch_id", BRANCH_ID).eq("status", "notified").lte("claim_expires_at", now)) as WaitlistEntry[];
  for (const w of lapsed) {
    await db().from("waitlist").update({ status: "expired" }).eq("id", w.id);
    await db().from("slot_locks").delete().eq("waitlist_id", w.id);
    // a cart hold made from this claim keeps its own lock until it expires
    await processSlot(w.court_id, w.date, w.hour);
  }
  const open = must(await db().from("waitlist").select("id, date, hour").eq("branch_id", BRANCH_ID).in("status", ["applied", "waiting", "notified"])) as Pick<WaitlistEntry, "id" | "date" | "hour">[];
  const started = open.filter((w) => slotStarted(w.date, w.hour)).map((w) => w.id);
  if (started.length) {
    await db().from("waitlist").update({ status: "expired" }).in("id", started);
    await db().from("slot_locks").delete().in("waitlist_id", started);
  }
  return lapsed.length + started.length;
}
