import Link from "next/link";
import { notFound } from "next/navigation";
import Receipt from "@/components/admin/Receipt";
import ReasonForm, { ActBtn } from "@/components/admin/ReasonForm";
import { Pill } from "@/components/ui";
import { Arrow } from "@/components/art";
import { approveRegAction, rejectRegAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { courtById } from "@/lib/catalog";
import { db } from "@/lib/supabase";
import { peso } from "@/lib/format";
import { fmtDateLong, fmtH, fmtTs } from "@/lib/time";
import type { ClassReg, ClassRow } from "@/lib/types";

/* Class registration detail: details, proof, approve / confirm / reject */
export default async function RegView({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const r = (await db().from("class_registrations").select("*").eq("id", id).maybeSingle()).data as ClassReg | null;
  if (!r) notFound();
  const k = (await db().from("classes").select("*").eq("id", r.class_id).single()).data as ClassRow;
  const court = await courtById(k.court_id);
  const back = `/admin/classes/reg/${r.id}`;
  return (
    <>
      <Link href={`/admin/classes/class/${k.id}`} style={{ fontSize: ".88rem" }}><Arrow dir="l" /> All registrations</Link>
      <div className="panel">
        <h2 style={{ fontSize: "1.3rem" }}>{r.ref} <Pill s={r.status} /></h2>
        <div className="g2" style={{ alignItems: "start" }}>
          <dl className="detail">
            <dt>Class</dt><dd>{k.title}</dd><dt>When</dt><dd>{fmtDateLong(k.date)}<br />{fmtH(k.start_hour)} – {fmtH(k.end_hour)} · {court?.name}</dd>
            <dt>Full name</dt><dd>{r.name}</dd><dt>Nickname</dt><dd>{r.nickname}</dd><dt>Age</dt><dd>{r.age}</dd>
            <dt>Email</dt><dd>{r.email}</dd><dt>Contact</dt><dd>{r.phone}</dd>
            <dt>Rental</dt><dd>{r.rent ? `1 × ${court?.type === "tennis" ? "Tennis Racket" : "Pickleball Paddle"} (${peso(k.rental_fee ?? 0)})` : "None"}</dd>
            <dt>Total</dt><dd className="lime"><b>{peso(r.total)}</b></dd>
            <dt>Payment</dt><dd>{r.method_name ? `${r.method_name} · ${r.pay_ref}` : "Not paid yet"}</dd>
            <dt>Submitted</dt><dd>{fmtTs(r.created_at)}</dd>
            {r.status === "awaiting" && r.pay_due_at ? <><dt>Pay by</dt><dd>{fmtTs(r.pay_due_at)}</dd></> : null}
            {r.paid_at ? <><dt>Paid</dt><dd>{fmtTs(r.paid_at)}</dd></> : null}
            {r.reason ? <><dt>Reason</dt><dd>{r.reason}</dd></> : null}
            {r.refund_pct != null ? <><dt>Refund</dt><dd>{r.refund_pct}%</dd></> : null}
          </dl>
          <div className="stack" style={{ gap: 8 }}><h4>Proof of payment</h4><Receipt path={r.proof_path} status={r.status} free={r.total === 0} dueAt={r.pay_due_at} paidAt={r.paid_at} /></div>
        </div>
        {r.status === "pending" || r.status === "verify" ? (
          <div className="row"><ActBtn action={approveRegAction} fields={{ id: r.id, back }} label={r.status === "verify" ? "Confirm payment" : "Approve"} small={false} /></div>
        ) : null}
      </div>
      {r.status === "pending" || r.status === "verify" ? (
        <div className="panel" id="reject">
          <h3>Reject {r.ref}</h3>
          <ReasonForm action={rejectRegAction} id={r.id} back={back} label="Reject registration"
            chips={r.status === "verify" ? ["Proof of payment is unclear.", "Amount paid does not match the total.", "Payment was not received."] : ["The class is full.", "Please contact us about this class."]}
            note={(r.status === "verify" ? "The payment is refunded in full. " : "Nothing was paid yet. ") + "The slot opens up for someone else."} />
        </div>
      ) : null}
    </>
  );
}
