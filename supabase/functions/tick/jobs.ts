/* eslint-disable @typescript-eslint/no-explicit-any -- the Supabase client is passed in untyped so this file has no npm imports */
/* Smash Corner · every-minute jobs (spec §18 Scheduled jobs), run by the tick Edge Function (index.ts) and by npm run test:e2e.
   Ported from the website's flows (src/lib/flows/bookings.ts, classes.ts, waitlist.ts), which still hold the admin- and
   customer-triggered versions of the same steps: keep the two in step (statuses, reasons, Activity Log wording, email
   keys). Emails use the shared layout in ../_shared/mail.ts.
   The Supabase client is passed in, so this file only imports _shared files and runs on Deno and Node alike. */
import { BRANCH_ID, CLAIM_HOURS, HOURS, REMIND_HOURS, SITE_INFO } from "../_shared/site.ts";
import { addDaysKey, fmtDateLong, fmtH, fmtRange, fmtTs, hourTs, slotStarted, todayKey, withinReminder } from "../_shared/time.ts";
import { LOCK_COLUMNS, stateOf, type LockRow, type SlotClass, type SlotState } from "../_shared/slots.ts";
import { equipmentText, type RecordItem } from "../_shared/records.ts";
import { bold, esc, sendMail, type MailConfig, type MailRow } from "../_shared/mail.ts";
import type { ReportClosure } from "../_shared/report.ts";

export type Db = { from(table: string): any };
export type TickConfig = { db: Db; siteUrl: string; linkSecret: string; mail: MailConfig };

type Booking = { id: string; ref: string; order_id: string; court_id: string; date: string; hours: number[]; players: number; equipment: Record<string, number>; total: number; name: string; email: string };
type Order = { id: string; name: string; email: string };
type Reg = { id: string; ref: string; class_id: string; name: string; nickname: string; age: number; email: string; rent: boolean; total: number };
type Klass = SlotClass & { id: string; title: string };
type Wait = { id: string; court_id: string; date: string; hour: number; name: string; email: string };
type Court = { id: string; name: string; type: string };
type Person = { name: string; email: string; nickname?: string };

function must<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
const peso = (n: number) => "₱" + Number(n).toLocaleString("en-PH"); // as src/lib/format.ts
const first = (p: Person) => p.nickname || p.name.trim().split(/\s+/)[0];

/* ---------- signed claim link (same token format as src/lib/links.ts, so the website can read it) ---------- */
const enc = (s: string) => new TextEncoder().encode(s);
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export async function makeToken(secret: string, p: { k: "claim"; id: string; exp: number }): Promise<string> {
  const body = b64url(enc(JSON.stringify(p)));
  const key = await crypto.subtle.importKey("raw", enc(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `${body}.${b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc(body))))}`;
}

export function tick(cfg: TickConfig) {
  const { db } = cfg;
  const now = () => new Date().toISOString();
  let catalog: Promise<{ courts: Court[]; items: RecordItem[] }> | null = null;
  const getCatalog = () => (catalog ??= Promise.all([
    db.from("courts").select("id, name, type").eq("branch_id", BRANCH_ID).then((r: any) => must<Court[]>(r)),
    db.from("equipment_items").select("id, name").then((r: any) => must<RecordItem[]>(r)),
  ] as [Promise<Court[]>, Promise<RecordItem[]>]).then(([courts, items]) => ({ courts, items })));
  const courtName = async (id: string) => (await getCatalog()).courts.find((c) => c.id === id)?.name ?? id;
  const log = (action: string, ref = "", note = "") =>
    db.from("activity_log").insert({ branch_id: BRANCH_ID, admin_email: null, admin_name: "System", action, ref, note }).then(() => undefined);
  const send = (to: string, subject: string, key: string, mail: Parameters<typeof sendMail>[1]["mail"]) => sendMail(cfg.mail, { to, subject, key, mail });

  /* ---------- email views and rows (as src/lib/flows/views.ts and src/lib/email/messages.tsx) ---------- */
  const bookingRows = async (b: Booking): Promise<MailRow[]> => {
    const { items } = await getCatalog();
    return [["Reference", bold(b.ref)], ["Court", esc(await courtName(b.court_id))], ["Date", esc(fmtDateLong(b.date))], ["Time", esc(fmtRange(b.hours))],
      ["Players", esc(b.players)], ["Equipment", esc(equipmentText(b.equipment, items))], ["Total", bold(peso(b.total))]];
  };
  const regRows = async (r: Reg, k: Klass): Promise<MailRow[]> => {
    const { courts, items } = await getCatalog();
    const court = courts.find((c) => c.id === k.court_id);
    const item = items.find((i) => i.id === (court?.type === "tennis" ? "racket" : "paddle"));
    return [["Reference", bold(r.ref)], ["Class", esc(k.title)], ["Court", esc(court?.name ?? k.court_id)], ["Date", esc(fmtDateLong(k.date))],
      ["Time", esc(`${fmtH(k.start_hour)} – ${fmtH(k.end_hour)}`)], ["Participant", esc(`${r.name} ("${r.nickname}"), age ${r.age}`)],
      ["Rental", esc(r.rent ? `1 × ${item?.name ?? "rental"}` : "None")], ["Total", bold(peso(r.total))]];
  };
  const venueRows: MailRow[] = [["Venue", esc(SITE_INFO.address)], ["Hours", esc(SITE_INFO.hours)]];

  /* ---------- waitlist hand-off (as src/lib/flows/waitlist.ts processSlot / notifyWaitlist) ---------- */
  async function hourState(courtId: string, date: string, h: number): Promise<SlotState> {
    const [closures, classes, locks] = await Promise.all([
      db.from("closures").select("*").eq("branch_id", BRANCH_ID).then((r: any) => must<ReportClosure[]>(r)),
      db.from("classes").select("*").eq("branch_id", BRANCH_ID).neq("status", "cancelled").eq("court_id", courtId).eq("date", date).then((r: any) => must<SlotClass[]>(r)),
      db.from("slot_locks").select(LOCK_COLUMNS).eq("court_id", courtId).eq("date", date).then((r: any) => must<LockRow[]>(r)),
    ]);
    return stateOf({ closures, classes, locks, session: null, claim: null }, courtId, date, h);
  }
  async function notifyWaitlist(w: Wait) {
    const expires = new Date(Date.now() + CLAIM_HOURS * 3600e3).toISOString();
    const lock = await db.from("slot_locks").insert({ court_id: w.court_id, date: w.date, hour: w.hour, waitlist_id: w.id });
    if (lock.error) return; // someone else took the hour in the meantime
    must(await db.from("waitlist").update({ status: "notified", claim_expires_at: expires }).eq("id", w.id));
    const court = await courtName(w.court_id);
    const link = `${cfg.siteUrl}/book?claim=${await makeToken(cfg.linkSecret, { k: "claim", id: w.id, exp: new Date(expires).getTime() })}`;
    await send(w.email, `A slot opened up: ${court}, ${fmtRange([w.hour])}`, `claim:${w.id}`, {
      audience: "customer", preview: "Your waitlisted slot is free for the next 2 hours.", title: "Your waitlisted slot is free", greeting: first(w),
      intro: `the slot you waited for is available. It is held for you for <b>2 hours</b>, until ${esc(fmtTs(expires))}.`,
      tables: [{ rows: [["Court", esc(court)], ["Date", esc(fmtDateLong(w.date))], ["Time", esc(fmtRange([w.hour]))]] }],
      button: { label: "Claim this slot", href: link }, after: "If you do not claim it in time, it goes to the next person in line.",
    });
  }
  async function processSlot(courtId: string, date: string, hour: number) {
    if (slotStarted(date, hour) || !HOURS.includes(hour)) return;
    if ((await hourState(courtId, date, hour)) !== "open") return;
    const next = must<Wait[]>(await db.from("waitlist").select("*").eq("branch_id", BRANCH_ID).eq("court_id", courtId).eq("date", date)
      .eq("hour", hour).eq("status", "waiting").order("approved_at").limit(1));
    if (next[0]) await notifyWaitlist(next[0]);
  }
  const releaseHours = async (courtId: string, date: string, hours: number[]) => { for (const h of hours) await processSlot(courtId, date, h); };

  /** 1. cart holds past their 15 minutes: delete (locks cascade) and offer the hours to the waitlist */
  async function expireHolds(): Promise<number> {
    const expired = must<{ court_id: string; date: string; hours: number[]; waitlist_id: string | null }[]>(
      await db.from("holds").delete().lte("expires_at", now()).select("court_id, date, hours, waitlist_id")) ?? [];
    for (const h of expired) {
      if (h.waitlist_id) await db.from("waitlist").update({ status: "expired" }).eq("id", h.waitlist_id).eq("status", "notified");
      await releaseHours(h.court_id, h.date, h.hours);
    }
    return expired.length;
  }

  /** 2. unused 2-hour waitlist claims (next person is emailed) and entries whose slot has started */
  async function expireWaitlist(): Promise<number> {
    const lapsed = must<Wait[]>(await db.from("waitlist").select("*").eq("branch_id", BRANCH_ID).eq("status", "notified").lte("claim_expires_at", now()));
    for (const w of lapsed) {
      await db.from("waitlist").update({ status: "expired" }).eq("id", w.id);
      await db.from("slot_locks").delete().eq("waitlist_id", w.id);
      // a cart hold made from this claim keeps its own lock until it expires
      await processSlot(w.court_id, w.date, w.hour);
    }
    const open = must<Pick<Wait, "id" | "date" | "hour">[]>(await db.from("waitlist").select("id, date, hour").eq("branch_id", BRANCH_ID).in("status", ["applied", "waiting", "notified"]));
    const started = open.filter((w) => slotStarted(w.date, w.hour)).map((w) => w.id);
    if (started.length) {
      await db.from("waitlist").update({ status: "expired" }).in("id", started);
      await db.from("slot_locks").delete().in("waitlist_id", started);
    }
    return lapsed.length + started.length;
  }

  /** 3. court requests not paid within 24 hours of approval → unpaid, hours released */
  async function expireUnpaidOrders(): Promise<number> {
    const rows = must<{ order_id: string }[]>(await db.from("bookings").select("order_id, orders!inner(pay_due_at)").eq("branch_id", BRANCH_ID)
      .eq("status", "awaiting").lte("orders.pay_due_at", now()));
    let n = 0;
    for (const id of new Set(rows.map((r) => r.order_id))) {
      const o = must<Order | null>(await db.from("orders").select("*").eq("id", id).maybeSingle());
      const l = must<Booking[]>(await db.from("bookings").select("*").eq("order_id", id).eq("status", "awaiting").order("date").order("created_at"));
      if (!o || !l.length) continue;
      must(await db.from("bookings").update({ status: "unpaid", reason: "Not paid within 24 hours of approval" }).in("id", l.map((x) => x.id)));
      for (const x of l) await log("Expired (not paid)", x.ref);
      const tables = await Promise.all(l.map(async (b) => ({ rows: await bookingRows(b) })));
      await send(o.email, `Booking request expired: ${l.map((b) => b.ref).join(", ")}`, `expired:${l[0].id}`, {
        audience: "customer", preview: "We didn't receive payment in time.", title: "Your request expired", greeting: first(o),
        intro: "we did not receive your payment within 24 hours, so your booking request has expired and the time was released.",
        tables, button: { label: "Book again", href: `${cfg.siteUrl}/book` },
      });
      for (const x of l) await releaseHours(x.court_id, x.date, x.hours);
      n++;
    }
    return n;
  }

  /** 4. class registrations not paid within 24 hours of approval → unpaid */
  async function expireUnpaidRegs(): Promise<number> {
    const due = must<Reg[]>(await db.from("class_registrations").select("*").eq("status", "awaiting").lte("pay_due_at", now()));
    for (const r of due) {
      await db.from("class_registrations").update({ status: "unpaid", reason: "Not paid within 24 hours of approval" }).eq("id", r.id);
      const k = must<Klass>(await db.from("classes").select("*").eq("id", r.class_id).single());
      await log("Expired (not paid)", r.ref, k.title);
      await send(r.email, `Class registration expired: ${r.ref}`, `expired:${r.id}`, {
        audience: "customer", preview: "We didn't receive payment in time.", title: "Your registration expired", greeting: first(r),
        intro: "we did not receive your payment within 24 hours, so your registration has expired and the slot was released.",
        tables: [{ rows: await regRows(r, k) }], button: { label: "Register again", href: `${cfg.siteUrl}/book?mode=class` },
      });
    }
    return due.length;
  }

  /** 5a. reminder 24 hours before a confirmed court booking */
  async function remindUpcoming(): Promise<number> {
    const today = todayKey();
    const rows = must<Booking[]>(await db.from("bookings").select("*").eq("branch_id", BRANCH_ID).eq("status", "approved")
      .is("reminded_at", null).gte("date", today).lte("date", addDaysKey(today, Math.ceil(REMIND_HOURS / 24))));
    let n = 0;
    for (const b of rows) {
      const start = hourTs(b.date, Math.min(...b.hours));
      if (start <= Date.now() || !withinReminder(b.date, Math.min(...b.hours))) continue;
      // claim the row first so an overlapping run can't email twice
      const claimed = must<{ id: string }[]>(await db.from("bookings").update({ reminded_at: now() }).eq("id", b.id).is("reminded_at", null).select("id"));
      if (!claimed.length) continue;
      await send(b.email, `Reminder: you're booked ${fmtDateLong(b.date)} – ${b.ref}`, `reminder:${b.id}:${start}`, {
        audience: "customer", preview: `${await courtName(b.court_id)}, ${fmtRange(b.hours)}. See you on court!`, title: "See you on court soon", greeting: first(b),
        intro: "a reminder that your booking starts within the next 24 hours. Please arrive 10 minutes early.",
        tables: [{ rows: await bookingRows(b) }, { rows: venueRows }],
      });
      n++;
    }
    return n;
  }

  /** 5b. reminder 24 hours before a class, once per confirmed participant */
  async function remindUpcomingRegs(): Promise<number> {
    const today = todayKey();
    const classes = must<Klass[]>(await db.from("classes").select("*").eq("branch_id", BRANCH_ID).neq("status", "cancelled")
      .gte("date", today).lte("date", addDaysKey(today, 1)));
    const due = classes.filter((k) => hourTs(k.date, k.start_hour) > Date.now() && withinReminder(k.date, k.start_hour));
    if (!due.length) return 0;
    const regs = must<Reg[]>(await db.from("class_registrations").select("*").in("class_id", due.map((k) => k.id)).eq("status", "approved").is("reminded_at", null));
    let n = 0;
    for (const r of regs) {
      const claimed = must<{ id: string }[]>(await db.from("class_registrations").update({ reminded_at: now() }).eq("id", r.id).is("reminded_at", null).select("id"));
      if (!claimed.length) continue;
      const k = due.find((x) => x.id === r.class_id)!;
      await send(r.email, `Reminder: ${k.title} on ${fmtDateLong(k.date)} – ${r.ref}`, `reminder:${r.id}`, {
        audience: "customer", preview: `${await courtName(k.court_id)}, ${fmtH(k.start_hour)} – ${fmtH(k.end_hour)}. See you there!`, title: "See you in class soon", greeting: first(r),
        intro: `a reminder that <b>${esc(k.title)}</b> starts within the next 24 hours. Please arrive 10 minutes early.`,
        tables: [{ rows: await regRows(r, k) }, { rows: venueRows }],
      });
      n++;
    }
    return n;
  }

  /** every job in order; one failing is logged and doesn't stop the others */
  async function runAll() {
    const out: Record<string, number | string> = {};
    const jobs: [string, () => Promise<number>][] = [
      ["holds", expireHolds], ["claims", expireWaitlist], ["orders", expireUnpaidOrders], ["regs", expireUnpaidRegs],
      ["reminders", async () => (await remindUpcoming()) + (await remindUpcomingRegs())],
    ];
    for (const [name, job] of jobs) {
      try { out[name] = await job(); } catch (e) { console.error(`tick: ${name} failed:`, e); out[name] = `failed: ${(e as Error).message}`; }
    }
    return out;
  }

  return { runAll, expireHolds, expireWaitlist, expireUnpaidOrders, expireUnpaidRegs, remindUpcoming, remindUpcomingRegs, processSlot };
}
