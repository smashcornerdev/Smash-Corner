export type CourtType = "tennis" | "pickle";
export type Court = {
  id: string; name: string; type: CourtType; rate: number; min_players: number; max_players: number;
  note: string; surface: string; size: string; sort_order: number;
};
export type EquipmentItem = { id: string; name: string; type: CourtType; rate: number; sort_order: number };
export type InventoryRow = { item_id: string; owned: number; out_of_service: number };
export type Equipment = Record<string, number>;

export type RequestStatus = "pending" | "awaiting" | "verify" | "approved" | "rejected" | "cancelled" | "unpaid";
export const OPEN_ST: RequestStatus[] = ["pending", "awaiting", "verify"];
export const ACTIVE_ST: RequestStatus[] = ["pending", "awaiting", "verify", "approved"];
export const isActive = (s: string) => (ACTIVE_ST as string[]).includes(s);

export type Order = {
  id: string; name: string; email: string; phone: string; free: boolean;
  method_id: string | null; method_name: string | null; pay_ref: string | null; proof_path: string | null;
  approved_at: string | null; pay_due_at: string | null; paid_at: string | null; created_at: string;
};
export type Booking = {
  id: string; ref: string; order_id: string; court_id: string; date: string; hours: number[]; players: number;
  equipment: Equipment; court_fee: number; equipment_fee: number; total: number; status: RequestStatus;
  name: string; email: string; phone: string; reason: string; refund_pct: number | null; edited: boolean;
  waitlist_id: string | null; reminded_at: string | null; created_at: string; updated_at: string;
};
export type BookingWithOrder = Booking & { orders: Order };

export type Hold = {
  id: string; session_id: string; court_id: string; date: string; hours: number[]; players: number;
  equipment: Equipment; court_fee: number; equipment_fee: number; total: number; name: string; email: string;
  phone: string; waitlist_id: string | null; expires_at: string; created_at: string;
};

export type WaitlistEntry = {
  id: string; court_id: string; date: string; hour: number; name: string; email: string; phone: string;
  players: number; status: "applied" | "declined" | "waiting" | "notified" | "claimed" | "expired" | "removed";
  approved_at: string | null; claim_expires_at: string | null; created_at: string;
};

export type PaymentMethod = {
  id: string; name: string; details: string; qr_url: string | null; qr_path: string | null;
  active: boolean; deleted: boolean; sort_order: number;
};

export type ClassRow = {
  id: string; title: string; court_id: string; date: string; start_hour: number; end_hour: number;
  deadline: string; capacity: number; fee: number; rental_fee: number | null; rental_qty: number;
  status: "open" | "closed" | "cancelled"; created_by: string; created_at: string;
};
export type ClassReg = {
  id: string; ref: string; class_id: string; name: string; nickname: string; age: number; email: string;
  phone: string; rent: boolean; total: number; status: RequestStatus; method_id: string | null;
  method_name: string | null; pay_ref: string | null; proof_path: string | null; approved_at: string | null;
  pay_due_at: string | null; paid_at: string | null; reason: string; refund_pct: number | null; reminded_at: string | null; created_at: string;
};

export type Closure = {
  id: string; court_ids: string[]; starts_on: string; ends_on: string | null; repeat_days: number[] | null;
  all_day: boolean; start_hour: number; end_hour: number; category: string; note: string;
  cancelled_count: number; created_by: string; created_at: string;
};

export type AdminRole = "super_admin" | "admin";
export type Admin = { email: string; name: string; role: AdminRole };

/* labels for status pills (spec §14) */
export const ST_LABEL: Record<string, string> = {
  pending: "pending", awaiting: "awaiting payment", verify: "verifying payment", approved: "approved",
  rejected: "rejected", cancelled: "cancelled", unpaid: "unpaid", applied: "applied", declined: "declined",
};
