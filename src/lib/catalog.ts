import "server-only";
import { cache } from "react";
import { BRANCH_ID } from "./config";
import { db, must } from "./supabase";
import type { Court, EquipmentItem, InventoryRow, PaymentMethod } from "./types";

export const getCourts = cache(async (): Promise<Court[]> =>
  must(await db().from("courts").select("*").eq("branch_id", BRANCH_ID).order("sort_order")) as Court[]);

export const getEquipment = cache(async (): Promise<EquipmentItem[]> =>
  must(await db().from("equipment_items").select("*").order("sort_order")) as EquipmentItem[]);

export const getInventory = cache(async (): Promise<InventoryRow[]> =>
  must(await db().from("inventory").select("item_id, owned, out_of_service").eq("branch_id", BRANCH_ID)) as InventoryRow[]);

/** payment methods customers see, in admin order */
export const getActiveMethods = cache(async (): Promise<PaymentMethod[]> =>
  must(await db().from("payment_methods").select("*").eq("branch_id", BRANCH_ID).eq("active", true).eq("deleted", false).order("sort_order")) as PaymentMethod[]);

export async function courtById(id: string): Promise<Court | undefined> {
  return (await getCourts()).find((c) => c.id === id);
}
