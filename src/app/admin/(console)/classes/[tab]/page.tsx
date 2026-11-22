import TabIntro from "@/components/admin/TabIntro";
import TabData from "@/components/admin/TabData";
import { SkelTable } from "@/components/admin/Skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RegTable } from "@/components/admin/RegTable";
import TableExport from "@/components/admin/TableExport";
import { getCourts } from "@/lib/catalog";
import { requireAdmin } from "@/lib/auth";
import { BRANCH_ID } from "@/lib/config";
import { db, must } from "@/lib/supabase";
import type { ClassReg, ClassRow } from "@/lib/types";

const NOTE: Record<string, string> = {
  pending: "New class registrations, oldest first. Nothing has been paid yet. Approve to email the participant the payment details (24 hours to pay), or reject.",
  awaiting: "Approved registrations waiting for payment. Unpaid registrations expire 24 hours after approval and free their slot.",
  verify: "The participant has paid and uploaded proof. Check the payment, then confirm or reject (refunded in full).",
  approved: "Confirmed (paid and verified) participants for all classes.",
  rejected: "Rejected registrations (refunded in full if they had paid).",
  cancelled: "Registrations cancelled because their class was cancelled.",
  unpaid: "Approved registrations that were not paid within 24 hours. Their slots were freed.",
};

/* Classes & Events registration tab (spec §7). v6.01: the note shows at once; the table streams in after it (skeleton until then). */
export default async function RegTab({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  if (!(tab in NOTE)) notFound();
  return (
    <>
      <TabIntro tab={tab} />
      <p className="muted" style={{ fontSize: ".88rem", maxWidth: "70ch" }}>{NOTE[tab]} To open, close or cancel a class, use <Link href="/admin/classes">Registration Controls</Link>.</p>
      <TabData tab={tab} fallback={<SkelTable cols={9} />}><RegData tab={tab} /></TabData>
    </>
  );
}

async function RegData({ tab }: { tab: string }) {
  await requireAdmin();
  const [classes, courts] = await Promise.all([db().from("classes").select("*").eq("branch_id", BRANCH_ID).then((r) => must(r) as ClassRow[]), getCourts()]);
  const regs = classes.length ? must(await db().from("class_registrations").select("*").eq("status", tab).in("class_id", classes.map((k) => k.id))
    .order("created_at", { ascending: ["pending", "awaiting", "verify"].includes(tab) })) as ClassReg[] : [];
  return <RegTable regs={regs} classes={classes} back={`/admin/classes/${tab}`} tools={<TableExport courts={courts} kind="class" />} />;
}
