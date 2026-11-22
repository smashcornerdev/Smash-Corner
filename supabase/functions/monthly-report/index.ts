// Smash Corner · monthly report email to super-admins (spec §19 Monthly report email, v6.21). Supabase Edge Function (Deno).
// pg_cron calls it at 8:00 AM Manila on the 1st (supabase/migrations/0007_monthly_report.sql). It emails every super-admin
// the previous calendar month: the 8 Reports KPIs against the month before, a class section, a link to Reports for that
// month, and an Excel file of that month's confirmed court bookings and class registrations. Each send is logged in the
// Activity Log; a month that was already sent is not sent again (body {"force": true} sends it anyway).
//
// Body (all optional): { "month": "2026-10", "force": true }
// Header: Authorization: Bearer <CRON_SECRET>
// Deploy:  supabase functions deploy monthly-report --no-verify-jwt      (the function checks CRON_SECRET itself)
// Secrets: supabase secrets set CRON_SECRET=… RESEND_API_KEY=… SITE_URL=https://smashcorner-qc.com
//          optional: EMAIL_FROM, EMAIL_TEST_TO, EMAIL_DRY_RUN=true   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided)
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.8.0";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";
import { CLASS_HEAD, COURT_HEAD, classRecord, courtRecord, type ClassRecordClass, type ClassRecordReg, type CourtRecordRow, type RecordItem } from "../_shared/records.ts";
import { classMetrics, metrics, type ReportClosure } from "../_shared/report.ts";
import { addDaysKey } from "../_shared/time.ts";
import { BRANCH_ID as DEFAULT_BRANCH, DEFAULT_SENDER, SITE_INFO } from "../_shared/site.ts";

const BRANCH_ID = Deno.env.get("BRANCH_ID") || DEFAULT_BRANCH;
const SITE_URL = (Deno.env.get("SITE_URL") || "https://smashcorner-qc.com").replace(/\/+$/, "");
const SENDER = Deno.env.get("EMAIL_FROM") || DEFAULT_SENDER;
const FOOTER = `${SITE_INFO.name} · ${SITE_INFO.address} · ${SITE_INFO.domain}`;
const ACTION = "Monthly report sent";
const C = { violet: "#330c65", lime: "#bdf86c", ink: "#141218", muted: "#5d5866", line: "#ece9f0", good: "#2f7d32", bad: "#b3261e" }; // src/lib/email/Mail.tsx

type Page = { data: unknown; error: { message: string } | null };
type Court = { id: string; name: string };
type Booking = CourtRecordRow & { id: string };
type Reg = ClassRecordReg & { class_id: string };
type Klass = ClassRecordClass & { id: string };

/* ---------- small helpers ---------- */
function authorized(req: Request): boolean {
  const enc = new TextEncoder();
  const want = enc.encode(Deno.env.get("CRON_SECRET") ?? ""), got = enc.encode(req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "");
  if (!want.length || got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want[i] ^ got[i];
  return diff === 0;
}
const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const peso = (n: number) => "₱" + Math.round(n).toLocaleString("en-PH");
const pct = (v: number) => (v * 100).toFixed(1) + "%";
const pad = (n: number) => String(n).padStart(2, "0");
const monthEnd = (m: string) => { const [y, mo] = m.split("-").map(Number); return `${m}-${pad(new Date(Date.UTC(y, mo, 0)).getUTCDate())}`; };
const monthBefore = (m: string) => addDaysKey(`${m}-01`, -1).slice(0, 7);
const monthName = (m: string) => { const [y, mo] = m.split("-").map(Number); return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-PH", { month: "long", year: "numeric", timeZone: "UTC" }); };
const lastMonth = () => monthBefore(new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 7)); // Manila "now", UTC+8
const excelDate = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
/** mm/dd/yyyy h:mm AM in Manila, as fmtTs in src/lib/time.ts */
const nowText = () => {
  const d = new Date(Date.now() + 8 * 3600e3), h = d.getUTCHours();
  return `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}/${d.getUTCFullYear()} ${h % 12 || 12}:${pad(d.getUTCMinutes())} ${h >= 12 ? "PM" : "AM"}`;
};
function base64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/* ---------- data ---------- */
async function readAll<T>(page: (from: number, to: number) => PromiseLike<Page>): Promise<T[]> {
  const out: T[] = [], size = 1000;
  for (let start = 0; ; start += size) {
    const { data, error } = await page(start, start + size - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < size) return out;
  }
}

/* ---------- Excel: confirmed records played that month (same columns and formats as Export to Excel) ---------- */
function workbook(month: string, courts: Court[], items: RecordItem[], bookings: Booking[], regs: Reg[], classes: Klass[]): Uint8Array | null {
  const cname = (id: string) => courts.find((c) => c.id === id)?.name ?? id;
  const court = bookings.map((b) => courtRecord(b, cname, items, excelDate));
  const klass = regs.map((r) => classRecord(r, classes.find((k) => k.id === r.class_id)!, cname, excelDate));
  if (!court.length && !klass.length) return null;
  const sheet = (head: string[], rows: unknown[][], money: number[], dateCol: number) => {
    const ws = XLSX.utils.aoa_to_sheet([head, ...rows], { cellDates: true });
    for (let r = 1; r <= rows.length; r++) {
      for (const c of money) { const cell = ws[XLSX.utils.encode_cell({ r, c })]; if (cell && typeof cell.v === "number") cell.z = '"₱"#,##0'; }
      const dc = ws[XLSX.utils.encode_cell({ r, c: dateCol })]; if (dc) dc.z = "mm/dd/yyyy";
    }
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(rows.length, 1), c: head.length - 1 } }) };
    ws["!cols"] = head.map((h) => ({ wch: Math.max(10, Math.min(30, h.length + 4)) }));
    return ws;
  };
  const sum = (l: { total: number }[]) => l.reduce((a, x) => a + x.total, 0);
  const summary = XLSX.utils.aoa_to_sheet([
    ["Exported", nowText()], ["By", "System (monthly report)"], ["Records", "Court bookings and classes & events"], ["Statuses", "approved"],
    ["Dates", `${monthName(month)} (booking date; class date for classes)`], [],
    ["Records", "Count", "Total", "Refunded"], ["Court bookings", bookings.length, sum(bookings), 0], ["Class registrations", regs.length, sum(regs), 0],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(COURT_HEAD, court, [11, 12, 13, 19], 6), "Court bookings");
  XLSX.utils.book_append_sheet(wb, sheet(CLASS_HEAD, klass, [12, 13, 14, 20], 4), "Class registrations");
  XLSX.utils.book_append_sheet(wb, summary, "Summary");
  return new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
}

/* ---------- email (same look as src/lib/email/Mail.tsx) ---------- */
function change(v: number, p: number, goodUp = true): string {
  if (!p && !v) return `<span style="color:${C.muted}">—</span>`;
  const up = v >= p, color = up === goodUp ? C.good : C.bad;
  return `<span style="color:${color};font-weight:700">${up ? "▲" : "▼"} ${p ? pct(Math.abs((v - p) / p)) : "new"}</span>`;
}
function table(heading: string, head: string[], rows: string[][]): string {
  const th = head.map((h, i) => `<td style="padding:6px ${i ? "0 6px 10px" : "10px 6px 0"};border-bottom:1px solid ${C.line};color:${C.muted};font-size:12px;${i ? "text-align:right;" : ""}">${esc(h)}</td>`).join("");
  const body = rows.map((r) => `<tr>${r.map((c, i) => `<td style="padding:6px ${i ? "0 6px 10px" : "10px 6px 0"};border-bottom:1px solid ${C.line};vertical-align:top;${i ? "text-align:right;white-space:nowrap;" : "color:" + C.muted + ";"}">${c}</td>`).join("")}</tr>`).join("");
  return `<p style="font-weight:700;margin:20px 0 4px;font-size:14px">${esc(heading)}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px"><tr>${th}</tr>${body}</table>`;
}
function html(o: { title: string; preview: string; intro: string; body: string; button: { label: string; href: string }; after: string }): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(o.title)}</title></head>
<body style="background:#f4f3f6;margin:0;font-family:'Lexend Deca','Segoe UI',Arial,sans-serif;color:${C.ink}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f6"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff">
<tr><td style="background:${C.violet};padding:16px 24px"><p style="margin:0;color:${C.lime};font-weight:900;letter-spacing:0.04em;font-size:16px">SMASH CORNER</p></td></tr>
<tr><td style="padding:8px 24px 24px">
<h2 style="font-size:20px;margin:20px 0 8px;color:${C.ink}">${esc(o.title)}</h2>
<p style="font-size:15px;line-height:22px;margin:8px 0">${o.intro}</p>
${o.body}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px"><tr><td style="background:${C.lime}"><a href="${esc(o.button.href)}" style="display:inline-block;padding:12px 20px;color:${C.violet};font-weight:700;font-size:15px;text-decoration:none">${esc(o.button.label)}</a></td></tr></table>
<p style="font-size:13px;color:${C.muted};margin:12px 0 0">${o.after}</p>
<hr style="border:none;border-top:1px solid ${C.line};margin:24px 0 12px">
<p style="font-size:12px;color:${C.muted};margin:0;line-height:18px">Sent to Smash Corner super-admin accounts.<br>${esc(FOOTER)}</p>
</td></tr></table></td></tr></table></body></html>`;
}

/* ---------- the report ---------- */
async function run(month: string, force: boolean) {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const label = monthName(month);
  const one = async <T>(p: PromiseLike<Page>): Promise<T[]> => { const { data, error } = await p; if (error) throw new Error(error.message); return (data ?? []) as T[]; };

  if (!force) {
    const sent = await one<{ id: number }>(db.from("activity_log").select("id").eq("branch_id", BRANCH_ID).eq("action", ACTION).eq("ref", label).limit(1));
    if (sent.length) return { month, skipped: "already sent" };
  }
  const to = await one<{ email: string }>(db.from("admins").select("email").eq("role", "super_admin"));
  if (!to.length) return { month, skipped: "no super-admins" };

  const from = `${month}-01`, end = monthEnd(month), pm = monthBefore(month), pFrom = `${pm}-01`, pEnd = monthEnd(pm);
  const [courts, closures, items, bookings, classes] = await Promise.all([
    one<Court>(db.from("courts").select("id, name").eq("branch_id", BRANCH_ID).order("sort_order")),
    one<ReportClosure>(db.from("closures").select("*").eq("branch_id", BRANCH_ID)),
    one<RecordItem>(db.from("equipment_items").select("id, name")),
    readAll<Booking>((a, b) => db.from("bookings").select("*, orders(*)").eq("branch_id", BRANCH_ID).gte("date", pFrom).lte("date", end).order("date").order("id").range(a, b)),
    one<Klass>(db.from("classes").select("*").eq("branch_id", BRANCH_ID).gte("date", pFrom).lte("date", end)),
  ]);
  const regs = classes.length
    ? await readAll<Reg>((a, b) => db.from("class_registrations").select("*").in("class_id", classes.map((k) => k.id)).order("created_at").order("id").range(a, b))
    : [];
  const classDate = new Map(classes.map((k) => [k.id, k.date]));
  const regsIn = (a: string, b: string) => regs.filter((r) => { const d = classDate.get(r.class_id)!; return d >= a && d <= b; });

  const cur = metrics(bookings, closures, from, end, "all", courts.length), prev = metrics(bookings, closures, pFrom, pEnd, "all", courts.length);
  const kc = classMetrics(regsIn(from, end)), kp = classMetrics(regsIn(pFrom, pEnd));
  const vs = `vs ${monthName(pm)}`;

  const kpis = table(`Court bookings · ${label}`, ["KPI", label, vs], [
    ["Total Revenue", peso(cur.gross), change(cur.gross, prev.gross)],
    ["Net Revenue", peso(cur.net), change(cur.net, prev.net)],
    ["Total Bookings", String(cur.bookings), change(cur.bookings, prev.bookings)],
    ["Court Utilization", pct(cur.util), change(cur.util, prev.util)],
    ["Cancellation Rate", pct(cur.cancelRate), change(cur.cancelRate, prev.cancelRate, false)],
    ["Average Booking Value", peso(cur.abv), change(cur.abv, prev.abv)],
    ["Revenue / Available Court-Hour", peso(cur.revpach), change(cur.revpach, prev.revpach)],
    ["Revenue / Occupied Court-Hour", peso(cur.revpoch), change(cur.revpoch, prev.revpoch)],
  ]);
  const cls = table(`Classes & events · ${label}`, ["", label, vs], [
    ["Confirmed registrations", String(kc.confirmed), change(kc.confirmed, kp.confirmed)],
    ["Class revenue", peso(kc.gross), change(kc.gross, kp.gross)],
    ["Refunds", peso(kc.refunds), change(kc.refunds, kp.refunds, false)],
    ["Net class revenue", peso(kc.net), change(kc.net, kp.net)],
  ]);
  const note = `<p style="font-size:12px;color:${C.muted};margin:8px 0 0">By play date (class date for classes) · ${cur.avail} available court-hours, closures subtracted. Court KPIs match the Reports page; class figures are not included in them.</p>`;

  const confirmedBookings = cur.appr, confirmedRegs = regsIn(from, end).filter((r) => r.status === "approved");
  const file = workbook(month, courts, items, confirmedBookings, confirmedRegs, classes);
  const filename = `smashcorner_monthly-report_${month}.xlsx`;
  const subject = `Smash Corner monthly report · ${label}`;
  const body = html({
    title: `Monthly report · ${label}`,
    preview: `${label}: net revenue ${peso(cur.net)}, ${cur.bookings} bookings, ${pct(cur.util)} utilization.`,
    intro: `Here is how ${esc(label)} went, compared with ${esc(monthName(pm))}.`,
    body: kpis + note + cls,
    button: { label: `Open Reports for ${label}`, href: `${SITE_URL}/admin/reports?r=custom&from=${from}&to=${end}` },
    after: file
      ? `Attached: <b>${esc(filename)}</b>, the ${confirmedBookings.length} confirmed court booking(s) and ${confirmedRegs.length} confirmed class registration(s) of ${esc(label)}. It contains customer personal data: please don't forward it outside the team.`
      : `No confirmed court bookings or class registrations in ${esc(label)}, so there is no Excel file this month.`,
  });

  const dryRun = Deno.env.get("EMAIL_DRY_RUN") === "true" || !Deno.env.get("RESEND_API_KEY");
  const testTo = Deno.env.get("EMAIL_TEST_TO") || "";
  const recipients = to.map((a) => a.email);
  if (dryRun) {
    console.info(`[email:dry-run] to=${recipients.join(", ")} subject="${subject}" attachment=${file ? filename : "none"}`);
  } else {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const attachments = file ? [{ filename, content: base64(file) }] : undefined;
    // one message per super-admin (attachments can't go through Resend's batch send); with EMAIL_TEST_TO, one copy to that address
    const sends = testTo ? [{ to: testTo, subject: `[to ${recipients.join(", ")}] ${subject}` }] : recipients.map((r) => ({ to: r, subject }));
    for (const s of sends) {
      const { error } = await resend.emails.send({ from: SENDER, to: s.to, subject: s.subject, html: body, attachments }, { idempotencyKey: `monthly-report/${month}/${s.to}${force ? "/" + Date.now() : ""}` });
      if (error) throw new Error(`Email to ${s.to} failed: ${error.message}`);
    }
  }
  const { error } = await db.from("activity_log").insert({
    branch_id: BRANCH_ID, admin_email: null, admin_name: "System", action: ACTION, ref: label,
    note: `To ${recipients.join(", ")} · ${confirmedBookings.length} bookings + ${confirmedRegs.length} class registrations attached${dryRun ? " · dry run (not sent)" : ""}`,
  });
  if (error) console.error("Activity Log insert failed:", error.message);
  return { month, sent: recipients.length, dryRun, attachment: file ? filename : null };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({})) as { month?: string; force?: boolean };
    const month = body.month ?? lastMonth();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return Response.json({ error: "month must look like 2026-10" }, { status: 400 });
    const result = await run(month, body.force === true);
    console.log("Monthly report:", result);
    return Response.json({ success: true, ...result });
  } catch (e) {
    console.error("Monthly report failed:", e);
    return Response.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
});
