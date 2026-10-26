import Link from "next/link";
import { notFound } from "next/navigation";
import { RegTable } from "@/components/admin/RegTable";
import { ActBtn } from "@/components/admin/ReasonForm";
import { Arrow } from "@/components/art";
import { classStatusAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { courtById } from "@/lib/catalog";
import { db, must } from "@/lib/supabase";
import { fmtDateLong, fmtH } from "@/lib/time";
import type { ClassReg, ClassRow } from "@/lib/types";

/* One class: its registrations + Cancel class (spec §7) */
export default async function ClassRegs({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const k = (await db().from("classes").select("*").eq("id", id).maybeSingle()).data as ClassRow | null;
  if (!k) notFound();
  const regs = must(await db().from("class_registrations").select("*").eq("class_id", id).order("created_at")) as ClassReg[];
  const live = regs.filter((r) => ["pending", "awaiting", "verify", "approved"].includes(r.status));
  const court = await courtById(k.court_id);
  return (
    <>
      <Link href="/admin/classes" style={{ fontSize: ".88rem" }}><Arrow dir="l" /> Registration Controls</Link>
      <div className="stack">
        <h2 style={{ fontSize: "1.2rem" }}>{k.title}</h2>
        <p className="muted">{court?.name} · {fmtDateLong(k.date)} · {fmtH(k.start_hour)} – {fmtH(k.end_hour)} · {live.length} of {k.capacity} slots taken</p>
        <RegTable regs={regs} classes={[k]} back={`/admin/classes/class/${k.id}`} showClass={false} />
      </div>
      {k.status !== "cancelled" ? (
        <div className="panel" id="cancel">
          <h3>Cancel &quot;{k.title}&quot;</h3>
          <p>{live.length ? <><b className="lime">{live.length} registration{live.length > 1 ? "s" : ""} will be cancelled</b>. Everyone who paid gets a 100% refund, and each participant is emailed.</> : "No one has registered yet."} The court becomes bookable again.</p>
          <div className="row"><ActBtn action={classStatusAction} fields={{ id: k.id, op: "cancel" }} label="Cancel class" cls="btn-danger" small={false} /></div>
        </div>
      ) : null}
    </>
  );
}
