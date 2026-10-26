import DataTable, { type Row } from "@/components/admin/DataTable";
import { ActBtn } from "@/components/admin/ReasonForm";
import { Pill } from "@/components/ui";
import { waitlistAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { BRANCH_ID } from "@/lib/config";
import { getCourts } from "@/lib/catalog";
import { db, must } from "@/lib/supabase";
import { ago, fmtDate, fmtH, fmtTs, todayKey } from "@/lib/time";
import type { WaitlistEntry } from "@/lib/types";

/* Waitlist (spec §9): customers apply, admins approve or decline; the line is FIFO by approval time; admins can notify now or remove */
export default async function WaitlistPage() {
  await requireAdmin();
  const [courts, list] = await Promise.all([
    getCourts(),
    db().from("waitlist").select("*").eq("branch_id", BRANCH_ID).gte("date", todayKey()).order("date").order("hour").order("created_at").then((r) => must(r) as WaitlistEntry[]),
  ]);
  const cname = (id: string) => courts.find((c) => c.id === id)?.name ?? id;
  const rows: Row[] = list.map((w) => {
    const pos = w.status === "waiting" ? list.filter((x) => x.status === "waiting" && x.court_id === w.court_id && x.date === w.date && x.hour === w.hour && x.approved_at! <= w.approved_at!).length : "–";
    const live = w.status === "waiting" || w.status === "notified";
    return {
      key: w.id, search: `${w.name} ${w.email} ${cname(w.court_id)} ${fmtDate(w.date)}`,
      cells: [
        <span key="s">{cname(w.court_id)}<br /><small className="muted">{fmtDate(w.date)} · {fmtH(w.hour)}</small></span>,
        <span key="p" className="tabnum">{pos}</span>,
        <span key="c">{w.name}<br /><small className="muted">{w.email}</small></span>,
        <span key="st"><Pill s={w.status} />{w.status === "notified" && w.claim_expires_at ? <><br /><small className="muted">Claim ends {fmtTs(w.claim_expires_at)}</small></> : null}</span>,
        <small key="j">{ago(w.created_at)}{w.approved_at ? <><br /><span className="muted">approved {ago(w.approved_at)}</span></> : null}</small>,
        <div className="acts" key="a">
          {w.status === "applied" ? <>
            <ActBtn action={waitlistAction} fields={{ id: w.id, op: "approve" }} label="Approve" />
            <ActBtn action={waitlistAction} fields={{ id: w.id, op: "decline" }} label="Decline" cls="btn-danger" />
          </> : null}
          {w.status === "waiting" ? <ActBtn action={waitlistAction} fields={{ id: w.id, op: "notify" }} label="Notify now" cls="btn-lav" /> : null}
          {live ? <ActBtn action={waitlistAction} fields={{ id: w.id, op: "remove" }} label="Remove" cls="btn-ghost" /> : w.status !== "applied" ? <span className="muted">—</span> : null}
        </div>,
      ],
    };
  });
  return (
    <>
      <p className="muted" style={{ maxWidth: "70ch" }}>Customers apply for the waitlist; approve an application to put them at the back of the line for that slot, or decline it. When a slot frees up, the first person in line is emailed a claim link that holds the slot for 2 hours, then it moves to the next person. The hand-off runs automatically.</p>
      <DataTable head={["Slot", "#", "Customer", "Status", "Applied", "Actions"]} rows={rows} empty="No one is on the waitlist." />
    </>
  );
}
