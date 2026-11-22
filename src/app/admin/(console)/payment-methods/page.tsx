import PaymentMethods, { AddMethodButton } from "@/components/admin/PaymentMethods";
import TabIntro from "@/components/admin/TabIntro";
import TabData from "@/components/admin/TabData";
import { SkelCards } from "@/components/admin/Skeleton";
import { requireAdmin } from "@/lib/auth";
import { BRANCH_ID } from "@/lib/config";
import { db, must } from "@/lib/supabase";
import type { PaymentMethod } from "@/lib/types";

/* Management → Payment Methods (super-admins, spec §16): add, edit, show/hide, drag to reorder, delete.
   v6.01: the note and + Add show at once; the list streams in after them (skeleton cards until then). */
export default function MethodsPage() {
  return (
    <>
      <TabIntro tab="payment-methods" />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <p className="muted" style={{ maxWidth: "68ch" }}>These are the payment options customers see on the Pay page, in this order. <b>Drag a payment method to change the order.</b> Each has a name, payment details (account name, number, instructions) and an optional QR code image. Hidden methods stay saved but customers can&apos;t choose them.</p>
        <AddMethodButton />
      </div>
      <TabData tab="payment-methods" fallback={<SkelCards />}><MethodsData /></TabData>
    </>
  );
}

async function MethodsData() {
  await requireAdmin({ superOnly: true });
  const list = must(await db().from("payment_methods").select("*").eq("branch_id", BRANCH_ID).eq("deleted", false).order("sort_order")) as PaymentMethod[];
  return <PaymentMethods methods={list.map((m) => ({ id: m.id, name: m.name, details: m.details, qr_url: m.qr_url, active: m.active }))} />;
}
