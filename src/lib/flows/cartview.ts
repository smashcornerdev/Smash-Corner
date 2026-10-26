import "server-only";
import { getCourts, getEquipment } from "../catalog";
import { equipmentText } from "../pricing";
import { getCart } from "./bookings";
import type { CartLine } from "@/components/book/CartList";

export async function cartLines(session: string | null): Promise<CartLine[]> {
  const [cart, courts, items] = await Promise.all([getCart(session), getCourts(), getEquipment()]);
  return cart.map((h) => {
    const c = courts.find((x) => x.id === h.court_id);
    return {
      id: h.id, court: c?.name ?? h.court_id, courtType: c?.type ?? "pickle", date: h.date, hours: h.hours, players: h.players,
      equipment: equipmentText(h.equipment, items), total: h.total, expires: h.expires_at, claim: !!h.waitlist_id,
    };
  });
}
