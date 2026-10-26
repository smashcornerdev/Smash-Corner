import "server-only";
import { BRANCH_ID, PAY_HOURS } from "../config";
import { db, dbErrorIs, must } from "../supabase";
import { getActiveMethods } from "../catalog";
import { payUrl } from "../links";
import { logAction } from "../log";
import { uploadReceipt } from "../storage";
import { addDaysKey, hourTs, todayKey, withinReminder } from "../time";
import { regView } from "./views";
import { FlowError } from "./bookings";
import * as M from "../email/messages";
import type { Admin, ClassReg, ClassRow } from "../types";

/* Class / event registration (spec §6, §7): same approve-then-pay lifecycle as bookings, one participant each. */

export type ClassState = "open" | "full" | "closed" | "done" | "cancelled";
const LIVE = ["pending", "awaiting", "verify", "approved"];

export function classState(k: ClassRow, taken: number): ClassState {
  if (k.status === "cancelled") return "cancelled";
  if (hourTs(k.date, k.start_hour) <= Date.now()) return "done";
  if (k.status !== "open" || Date.now() >= new Date(k.deadline).getTime()) return "closed";
  return taken < k.capacity ? "open" : "full";
}

export type ClassWithCounts = { k: ClassRow; taken: number; rented: number; notConfirmed: number; all: number; state: ClassState };

export async function classesWithCounts(filter: { bookable?: boolean } = {}): Promise<ClassWithCounts[]> {
  const classes = must(await db().from("classes").select("*").eq("branch_id", BRANCH_ID).order("date").order("start_hour")) as ClassRow[];
  if (!classes.length) return [];
  const regs = must(await db().from("class_registrations").select("class_id, status, rent").in("class_id", classes.map((k) => k.id))) as Pick<ClassReg, "class_id" | "status" | "rent">[];
  const rows = classes.map((k) => {
    const live = regs.filter((r) => r.class_id === k.id && LIVE.includes(r.status));
    return {
      k, taken: live.length, rented: live.filter((r) => r.rent).length, notConfirmed: live.filter((r) => r.status !== "approved").length,
      all: regs.filter((r) => r.class_id === k.id).length, state: classState(k, live.length),
    };
  });
  return filter.bookable ? rows.filter((r) => r.state === "open" || r.state === "full") : rows;
}

export async function register(inp: { classId: string; name: string; nickname: string; age: number; email: string; phone: string; rent: boolean }) {
  let id: string;
  try {
    id = must(await db().rpc("register_class", {
      p_class: inp.classId, p_name: inp.name, p_nickname: inp.nickname, p_age: inp.age, p_email: inp.email, p_phone: inp.phone, p_rent: inp.rent,
    })) as string;
  } catch (e) {
    if (dbErrorIs(e, "class_closed")) throw new FlowError("Sorry, registration for this class just closed.");
    if (dbErrorIs(e, "class_full")) throw new FlowError("Sorry, this class just filled up.");
    if (dbErrorIs(e, "rental_gone")) throw new FlowError("The last rental was just taken. Choose again.");
    if (dbErrorIs(e, "already_registered")) throw new FlowError("This person is already registered for this class.");
    throw e;
  }
  const { r, k } = await loadReg(id);
  const v = await regView(r, k);
  await M.mailClassReceived(r, v);
  await M.mailAdminNewClass(v);
  return r;
}

export async function loadReg(id: string) {
  const r = (await db().from("class_registrations").select("*").eq("id", id).maybeSingle()).data as ClassReg | null;
  if (!r) throw new FlowError("Registration not found.");
  const k = (await db().from("classes").select("*").eq("id", r.class_id).single()).data as ClassRow;
  return { r, k };
}

/** pending → awaiting payment (free class → approved); verify → approved */
export async function approveReg(admin: Admin, id: string): Promise<string> {
  const { r, k } = await loadReg(id);
  const v = await regView(r, k);
  if (r.status === "pending" && r.total > 0) {
    const now = new Date(), due = new Date(now.getTime() + PAY_HOURS * 3600e3).toISOString();
    must(await db().from("class_registrations").update({ status: "awaiting", approved_at: now.toISOString(), pay_due_at: due }).eq("id", r.id));
    await logAction(admin, "Class registration approved", r.ref, `${k.title} · ${r.name} · waiting for payment`);
    await M.mailPleasePay("class", r, [v], due, await getActiveMethods(), payUrl("class", r.id, due));
    return `${r.ref} approved. Participant emailed the payment details (24 hours to pay).`;
  }
  if (r.status !== "pending" && r.status !== "verify") throw new FlowError("This registration can't be approved now.");
  const paid = r.status === "verify";
  // starting within 24 h: the confirmation email doubles as the reminder
  must(await db().from("class_registrations").update({ status: "approved", ...(withinReminder(k.date, k.start_hour) ? { reminded_at: new Date().toISOString() } : {}) }).eq("id", r.id));
  await logAction(admin, paid ? "Class payment verified" : "Class registration approved", r.ref, `${k.title} · ${r.name}`);
  await M.mailClassConfirmed(r, v, paid);
  return `${r.ref} confirmed. Participant emailed.`;
}

export async function rejectReg(admin: Admin, id: string, reason: string): Promise<string> {
  const { r, k } = await loadReg(id);
  if (r.status !== "pending" && r.status !== "verify") throw new FlowError("This registration can't be rejected now.");
  const paid = r.status === "verify";
  must(await db().from("class_registrations").update({ status: "rejected", reason, refund_pct: paid ? 100 : null }).eq("id", r.id));
  await logAction(admin, "Class registration rejected", r.ref, `${k.title} · ${r.name}${reason ? " · " + reason : ""}`);
  await M.mailClassRejected(r, await regView(r, k), reason, paid);
  return `${r.ref} rejected. Participant emailed.`;
}

export async function submitClassPayment(regId: string, methodId: string, payRef: string, file: File) {
  const { r, k } = await loadReg(regId);
  if (r.status !== "awaiting") throw new FlowError("This registration can no longer be paid.");
  if (r.pay_due_at && new Date(r.pay_due_at).getTime() <= Date.now()) throw new FlowError("The payment window has ended.");
  const method = (await getActiveMethods()).find((m) => m.id === methodId);
  if (!method) throw new FlowError("Choose how you paid.");
  if (payRef.trim().length < 4) throw new FlowError("Enter the reference number from your receipt.");
  const path = await uploadReceipt(file, `classes/${regId}`);
  must(await db().from("class_registrations").update({
    status: "verify", method_id: method.id, method_name: method.name, pay_ref: payRef.trim(), proof_path: path, paid_at: new Date().toISOString(),
  }).eq("id", r.id));
  const v = await regView(r, k);
  await M.mailPaymentReceived("class", r, [v]);
  await M.mailAdminVerify("class", r, [v], method.name, payRef.trim());
}

export async function cancelClass(admin: Admin, classId: string): Promise<string> {
  const k = (await db().from("classes").select("*").eq("id", classId).single()).data as ClassRow;
  const regs = must(await db().from("class_registrations").select("*").eq("class_id", classId).in("status", LIVE)) as ClassReg[];
  must(await db().from("classes").update({ status: "cancelled" }).eq("id", classId));
  for (const r of regs) {
    const paid = r.status === "verify" || r.status === "approved";
    await db().from("class_registrations").update({ status: "cancelled", refund_pct: paid ? 100 : null, reason: "Class cancelled by Smash Corner" }).eq("id", r.id);
    await M.mailClassCancelled(r, await regView(r, k), paid);
  }
  await logAction(admin, "Class cancelled", k.title, `${regs.length} registration(s) cancelled`);
  return `"${k.title}" cancelled${regs.length ? `. ${regs.length} participant(s) emailed.` : "."}`;
}

export async function expireUnpaidRegs(): Promise<number> {
  const due = must(await db().from("class_registrations").select("*").eq("status", "awaiting").lte("pay_due_at", new Date().toISOString())) as ClassReg[];
  for (const r of due) {
    await db().from("class_registrations").update({ status: "unpaid", reason: "Not paid within 24 hours of approval" }).eq("id", r.id);
    const k = (await db().from("classes").select("*").eq("id", r.class_id).single()).data as ClassRow;
    await logAction(null, "Expired (not paid)", r.ref, k.title);
    await M.mailClassExpired(r, await regView(r, k));
  }
  return due.length;
}

/** cron: reminder email 24 h before the class starts, once per confirmed participant */
export async function remindUpcomingRegs(): Promise<number> {
  const today = todayKey();
  const classes = must(await db().from("classes").select("*").eq("branch_id", BRANCH_ID).neq("status", "cancelled")
    .gte("date", today).lte("date", addDaysKey(today, 1))) as ClassRow[];
  const due = classes.filter((k) => hourTs(k.date, k.start_hour) > Date.now() && withinReminder(k.date, k.start_hour));
  if (!due.length) return 0;
  const regs = must(await db().from("class_registrations").select("*").in("class_id", due.map((k) => k.id))
    .eq("status", "approved").is("reminded_at", null)) as ClassReg[];
  let n = 0;
  for (const r of regs) {
    // claim the row first so an overlapping run can't email twice
    const claimed = must(await db().from("class_registrations").update({ reminded_at: new Date().toISOString() })
      .eq("id", r.id).is("reminded_at", null).select("id")) as { id: string }[];
    if (!claimed.length) continue;
    await M.mailClassReminder(r, await regView(r, due.find((k) => k.id === r.class_id)!), `reminder:${r.id}`);
    n++;
  }
  return n;
}
