import type { Court, Equipment, EquipmentItem } from "./types";

/** court fee + equipment rental (per item, per hour) — spec §15 */
export function priceBooking(court: Court, hours: number, equipment: Equipment, items: EquipmentItem[]) {
  const courtFee = court.rate * hours;
  let equipmentFee = 0;
  for (const [id, qty] of Object.entries(equipment)) {
    const it = items.find((i) => i.id === id);
    if (it && qty > 0) equipmentFee += it.rate * qty * hours;
  }
  return { courtFee, equipmentFee, total: courtFee + equipmentFee };
}

export function equipmentText(eq: Equipment, items: EquipmentItem[]): string {
  const parts = Object.entries(eq).filter(([, q]) => q > 0).map(([id, q]) => `${q} × ${items.find((i) => i.id === id)?.name ?? id}`);
  return parts.length ? parts.join(", ") : "None";
}
