import Link from "next/link";
import { notFound } from "next/navigation";
import { RegTable } from "@/components/admin/RegTable";
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

export default async function RegTab({ params }: { params: Promise<{ tab: string }> }) {
  await requireAdmin();
  const { tab } = await params;
  if (!(tab in NOTE)) notFound();
  const classes = must(await db().from("classes").select("*").eq("branch_id", BRANCH_ID)) as ClassRow[];
  const regs = classes.length ? must(await db().from("class_registrations").select("*").eq("status", tab).in("class_id", classes.map((k) => k.id))
    .order("created_at", { ascending: ["pending", "awaiting", "verify"].includes(tab) })) as ClassReg[] : [];
  return (
    <>
      <p className="muted" style={{ fontSize: ".88rem", maxWidth: "70ch" }}>{NOTE[tab]} To open, close or cancel a class, use <Link href="/admin/classes">Registration Controls</Link>.</p>
      <RegTable regs={regs} classes={classes} back={`/admin/classes/${tab}`} />
    </>
  );
}
