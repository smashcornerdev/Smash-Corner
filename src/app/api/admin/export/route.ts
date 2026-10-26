import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { assertAdmin } from "@/lib/auth";
import { BRANCH_ID } from "@/lib/config";
import { db, must } from "@/lib/supabase";
import { getCourts, getEquipment } from "@/lib/catalog";
import { equipmentText } from "@/lib/pricing";
import { logAction } from "@/lib/log";
import { fmtH, fmtRange, fmtTs, parseKey } from "@/lib/time";
import { ST_LABEL, type ClassReg, type ClassRow } from "@/lib/types";
import type { BookingRow } from "@/lib/adminData";

/* Export to Excel (spec §7): real .xlsx built on the server; only signed-in admins can call it. */
const excelDate = (k: string) => { const { y, m, d } = parseKey(k); return new Date(Date.UTC(y, m - 1, d)); };
const PESO = '"₱"#,##0';

export async function GET(req: NextRequest) {
  let admin;
  try { admin = await assertAdmin(); } catch { return NextResponse.json({ error: "No access" }, { status: 403 }); }
  const q = req.nextUrl.searchParams;
  const kind = q.get("kind") === "class" ? "class" : "court";
  const from = q.get("from") || "", to = q.get("to") || "", basis = q.get("basis") === "submitted" ? "submitted" : "play";
  // checkboxes arrive as repeated stx / cx params; st / courts (comma lists) also work
  const statuses = (q.getAll("stx").length ? q.getAll("stx") : (q.get("st") || "approved,rejected,cancelled").split(",")).filter((s) => s in ST_LABEL);
  const courtsWanted = q.getAll("cx").length ? q.getAll("cx") : (q.get("courts") || "").split(",").filter(Boolean);
  const classIds = q.getAll("kx"), preview = q.get("preview") === "1"; // preview: JSON count + first rows for the Export window, no file, not logged
  const [courts, items] = await Promise.all([getCourts(), getEquipment()]);
  const cname = (id: string) => courts.find((c) => c.id === id)?.name ?? id;
  const inRange = (k: string) => (!from || k >= from) && (!to || k <= to);
  const head: string[] = [], rows: unknown[][] = [];
  const sample: (string | number)[][] = []; // ref, name, court or class, date, status, total
  let classList: ClassRow[] = [];
  const totals: Record<string, { n: number; total: number; refunded: number }> = {};
  const tally = (st: string, total: number, refundPct: number | null) => {
    const t = (totals[st] ??= { n: 0, total: 0, refunded: 0 });
    t.n++; t.total += total; t.refunded += Math.round((total * (refundPct ?? 0)) / 100);
  };

  if (kind === "court") {
    const list = must(await db().from("bookings").select("*, orders(*)").eq("branch_id", BRANCH_ID).in("status", statuses).order("date")) as BookingRow[];
    head.push("Reference", "Status", "Customer", "Email", "Contact number", "Court", "Booking date", "Time", "Hours", "Players", "Equipment", "Court fee", "Equipment fee", "Total", "Payment method", "Payment reference", "Submitted", "Reason", "Refund %", "Refund amount", "Edited by admin");
    for (const b of list) {
      if (courtsWanted.length && !courtsWanted.includes(b.court_id)) continue;
      if (!inRange(basis === "play" ? b.date : b.created_at.slice(0, 10))) continue;
      const refund = Math.round((b.total * (b.refund_pct ?? 0)) / 100);
      rows.push([b.ref, ST_LABEL[b.status], b.name, b.email, b.phone, cname(b.court_id), excelDate(b.date), fmtRange(b.hours), b.hours.length, b.players, equipmentText(b.equipment, items),
        b.court_fee, b.equipment_fee, b.total, b.orders.method_name ?? "", b.orders.pay_ref ?? "", fmtTs(b.created_at), b.reason, b.refund_pct ?? "", b.refund_pct != null ? refund : "", b.edited ? "Yes" : "No"]);
      sample.push([b.ref, b.name, cname(b.court_id), b.date, b.status, b.total]);
      tally(b.status, b.total, b.refund_pct);
    }
  } else {
    const classes = must(await db().from("classes").select("*").eq("branch_id", BRANCH_ID)) as ClassRow[];
    classList = classes;
    const regs = classes.length ? must(await db().from("class_registrations").select("*").in("class_id", classes.map((k) => k.id)).in("status", statuses).order("created_at")) as ClassReg[] : [];
    head.push("Reference", "Status", "Class / event", "Court", "Class date", "Time", "Full name", "Nickname", "Age", "Email", "Contact number", "Rental", "Class fee", "Rental fee", "Total", "Payment method", "Payment reference", "Submitted", "Reason", "Refund %", "Refund amount");
    for (const r of regs) {
      const k = classes.find((x) => x.id === r.class_id)!;
      if (classIds.length && !classIds.includes(k.id)) continue;
      if (!inRange(basis === "play" ? k.date : r.created_at.slice(0, 10))) continue;
      const rentalFee = r.rent ? k.rental_fee ?? 0 : 0, refund = Math.round((r.total * (r.refund_pct ?? 0)) / 100);
      rows.push([r.ref, ST_LABEL[r.status], k.title, cname(k.court_id), excelDate(k.date), `${fmtH(k.start_hour)} – ${fmtH(k.end_hour)}`, r.name, r.nickname, r.age, r.email, r.phone,
        r.rent ? "Yes" : "No", k.fee, rentalFee, r.total, r.method_name ?? "", r.pay_ref ?? "", fmtTs(r.created_at), r.reason, r.refund_pct ?? "", r.refund_pct != null ? refund : ""]);
      sample.push([r.ref, r.name, k.title, k.date, r.status, r.total]);
      tally(r.status, r.total, r.refund_pct);
    }
  }

  if (preview) {
    const listed = classList.filter((k) => basis !== "play" || inRange(k.date)).sort((a, b) => a.date.localeCompare(b.date) || a.start_hour - b.start_hour);
    return NextResponse.json({
      count: rows.length, total: sample.reduce((a, x) => a + Number(x[5]), 0), sample: sample.slice(0, 5),
      classes: listed.map((k) => ({ id: k.id, title: k.title, when: `${fmtH(k.start_hour)} – ${fmtH(k.end_hour)}`, date: k.date, court: cname(k.court_id), status: k.status })),
    }, { headers: { "Cache-Control": "no-store" } });
  }

  const ws = XLSX.utils.aoa_to_sheet([head, ...rows], { cellDates: true });
  const money = kind === "court" ? [11, 12, 13, 19] : [12, 13, 14, 20];
  const dateCol = kind === "court" ? 6 : 4;
  for (let r = 1; r <= rows.length; r++) {
    for (const c of money) { const cell = ws[XLSX.utils.encode_cell({ r, c })]; if (cell && typeof cell.v === "number") cell.z = PESO; }
    const dc = ws[XLSX.utils.encode_cell({ r, c: dateCol })]; if (dc) dc.z = "mm/dd/yyyy";
  }
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(rows.length, 1), c: head.length - 1 } }) };
  ws["!cols"] = head.map((h) => ({ wch: Math.max(10, Math.min(30, h.length + 4)) }));

  const range = from || to ? `${from || "start"}_to_${to || "today-onward"}` : "all-dates";
  const summary = XLSX.utils.aoa_to_sheet([
    ["Exported", fmtTs(new Date())], ["By", admin.name], ["Records", kind === "court" ? "Court bookings" : "Classes & events"],
    ["Statuses", statuses.map((s) => ST_LABEL[s]).join(", ")], ["Dates", `${range.replace(/_/g, " ")} (${basis === "play" ? "booking date" : "date submitted"})`],
    ...(kind === "court" ? [["Courts", courtsWanted.length ? courtsWanted.map(cname).join(", ") : "All courts"]] : []),
    [], ["Status", "Count", "Total", "Refunded"],
    ...Object.entries(totals).map(([st, t]) => [ST_LABEL[st], t.n, t.total, t.refunded]),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, kind === "court" ? "Court bookings" : "Class registrations");
  XLSX.utils.book_append_sheet(wb, summary, "Summary");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  await logAction(admin, "Exported to Excel", kind === "court" ? "Court bookings" : "Classes & events", `${rows.length} records · ${statuses.join(", ")} · ${range}`);
  const name = `smashcorner_${kind === "court" ? "court-bookings" : "class-registrations"}_${range}.xlsx`;
  return new NextResponse(new Uint8Array(buf), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });
}
