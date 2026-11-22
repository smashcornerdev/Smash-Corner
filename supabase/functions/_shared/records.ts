/* Customer record columns (spec §7), shared by Export to Excel (Next.js, via src/lib/records.ts) and the Edge Functions
   (Deno). Imports only other _shared files. equipmentText must match src/lib/pricing.ts, LABEL must match ST_LABEL in src/lib/types.ts. */
import { fmtH, fmtRange, fmtTs } from "./time.ts";
export type Cell = string | number | Date;
type ShowDate = (key: string) => Cell;

export type CourtRecordRow = {
  ref: string; status: string; name: string; email: string; phone: string; court_id: string; date: string; hours: number[];
  players: number; equipment: Record<string, number>; court_fee: number; equipment_fee: number; total: number; created_at: string;
  reason: string; refund_pct: number | null; edited: boolean; orders: { method_name: string | null; pay_ref: string | null };
};
export type ClassRecordReg = {
  ref: string; status: string; name: string; nickname: string; age: number; email: string; phone: string; rent: boolean; total: number;
  method_name: string | null; pay_ref: string | null; reason: string; refund_pct: number | null; created_at: string;
};
export type ClassRecordClass = { title: string; court_id: string; date: string; start_hour: number; end_hour: number; fee: number; rental_fee: number | null };
export type RecordItem = { id: string; name: string };

export const COURT_HEAD = ["Reference", "Status", "Customer", "Email", "Contact number", "Court", "Booking date", "Time", "Hours", "Players", "Equipment", "Court fee", "Equipment fee", "Total", "Payment method", "Payment reference", "Submitted", "Reason", "Refund %", "Refund amount", "Edited by admin"];
export const CLASS_HEAD = ["Reference", "Status", "Class / event", "Court", "Class date", "Time", "Full name", "Nickname", "Age", "Email", "Contact number", "Rental", "Class fee", "Rental fee", "Total", "Payment method", "Payment reference", "Submitted", "Reason", "Refund %", "Refund amount"];

const LABEL: Record<string, string> = {
  pending: "pending", awaiting: "awaiting payment", verify: "verifying payment", approved: "approved",
  rejected: "rejected", cancelled: "cancelled", unpaid: "unpaid", applied: "applied", declined: "declined",
};
export function equipmentText(eq: Record<string, number>, items: RecordItem[]): string {
  const parts = Object.entries(eq ?? {}).filter(([, q]) => q > 0).map(([id, q]) => `${q} × ${items.find((i) => i.id === id)?.name ?? id}`);
  return parts.length ? parts.join(", ") : "None";
}

export function courtRecord(b: CourtRecordRow, courtName: (id: string) => string, items: RecordItem[], showDate: ShowDate): Cell[] {
  const refund = Math.round((b.total * (b.refund_pct ?? 0)) / 100);
  return [b.ref, LABEL[b.status] ?? b.status, b.name, b.email, b.phone, courtName(b.court_id), showDate(b.date), fmtRange(b.hours), b.hours.length, b.players, equipmentText(b.equipment, items),
    b.court_fee, b.equipment_fee, b.total, b.orders.method_name ?? "", b.orders.pay_ref ?? "", fmtTs(b.created_at), b.reason, b.refund_pct ?? "", b.refund_pct != null ? refund : "", b.edited ? "Yes" : "No"];
}

export function classRecord(r: ClassRecordReg, k: ClassRecordClass, courtName: (id: string) => string, showDate: ShowDate): Cell[] {
  const rentalFee = r.rent ? k.rental_fee ?? 0 : 0, refund = Math.round((r.total * (r.refund_pct ?? 0)) / 100);
  return [r.ref, LABEL[r.status] ?? r.status, k.title, courtName(k.court_id), showDate(k.date), `${fmtH(k.start_hour)} – ${fmtH(k.end_hour)}`, r.name, r.nickname, r.age, r.email, r.phone,
    r.rent ? "Yes" : "No", k.fee, rentalFee, r.total, r.method_name ?? "", r.pay_ref ?? "", fmtTs(r.created_at), r.reason, r.refund_pct ?? "", r.refund_pct != null ? refund : ""];
}
