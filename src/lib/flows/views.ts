import "server-only";
import { getCourts, getEquipment } from "../catalog";
import { equipmentText } from "../pricing";
import type { BookingView, RegView } from "../email/messages";
import type { Booking, ClassReg, ClassRow } from "../types";

/** DB rows → the plain shapes the emails use */
export async function bookingViews(l: Booking[]): Promise<BookingView[]> {
  const [courts, items] = await Promise.all([getCourts(), getEquipment()]);
  return l.map((b) => ({
    id: b.id, ref: b.ref, court: courts.find((c) => c.id === b.court_id)?.name ?? b.court_id, date: b.date, hours: b.hours,
    players: b.players, equipment: equipmentText(b.equipment, items), total: b.total,
  }));
}
export async function regView(r: ClassReg, k: ClassRow): Promise<RegView> {
  const [courts, items] = await Promise.all([getCourts(), getEquipment()]);
  const court = courts.find((c) => c.id === k.court_id);
  const item = items.find((i) => i.id === (court?.type === "tennis" ? "racket" : "paddle"));
  return {
    id: r.id, ref: r.ref, title: k.title, court: court?.name ?? k.court_id, date: k.date, start: k.start_hour, end: k.end_hour,
    name: r.name, nickname: r.nickname, age: r.age, rental: r.rent ? `1 × ${item?.name ?? "rental"}` : "None", total: r.total,
  };
}
