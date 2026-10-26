import PaymentMethods from "@/components/admin/PaymentMethods";
import { requireAdmin } from "@/lib/auth";
import { BRANCH_ID } from "@/lib/config";
import { db, must } from "@/lib/supabase";
import type { PaymentMethod } from "@/lib/types";

/* Management → Payment Methods (super-admins, spec §16): add, edit, show/hide, drag to reorder, delete */
export default async function MethodsPage() {
  await requireAdmin({ superOnly: true });
  const list = must(await db().from("payment_methods").select("*").eq("branch_id", BRANCH_ID).eq("deleted", false).order("sort_order")) as PaymentMethod[];
  return <PaymentMethods methods={list.map((m) => ({ id: m.id, name: m.name, details: m.details, qr_url: m.qr_url, active: m.active }))} />;
}
