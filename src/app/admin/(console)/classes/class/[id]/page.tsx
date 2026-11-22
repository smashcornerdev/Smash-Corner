import Link from "next/link";
import { notFound } from "next/navigation";
import ClassDetail from "@/components/admin/ClassDetail";
import { Arrow } from "@/components/art";
import { requireAdmin } from "@/lib/auth";
import { courtById } from "@/lib/catalog";
import { db, must } from "@/lib/supabase";
import type { ClassReg, ClassRow } from "@/lib/types";

/* One class: its registrations + Cancel class (spec §7); the body is shared with the Registration Controls card (ClassDetail) */
export default async function ClassRegs({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const k = (await db().from("classes").select("*").eq("id", id).maybeSingle()).data as ClassRow | null;
  if (!k) notFound();
  const regs = must(await db().from("class_registrations").select("*").eq("class_id", id).order("created_at")) as ClassReg[];
  const court = await courtById(k.court_id);
  return (
    <>
      <Link href="/admin/classes" style={{ fontSize: ".88rem" }}><Arrow dir="l" /> Registration Controls</Link>
      <ClassDetail k={k} regs={regs} courtName={court?.name} back={`/admin/classes/class/${k.id}`} />
    </>
  );
}
