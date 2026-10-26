import { Fragment } from "react";
import DataTable, { type Row } from "@/components/admin/DataTable";
import ClosureForm from "@/components/admin/ClosureForm";
import ModalButton from "@/components/admin/Modal";
import { ActBtn } from "@/components/admin/ReasonForm";
import { reopenClosureAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getClosures } from "@/lib/availability";
import { getCourts } from "@/lib/catalog";
import { closureDatesText, closureOn, closureReason, NO_END } from "@/lib/closures";
import { fmtDate, fmtH, manilaHour, todayKey } from "@/lib/time";
import type { Closure } from "@/lib/types";

/* Management → Closures (super-admins, spec §7) */
export default async function ClosuresPage() {
  await requireAdmin({ superOnly: true });
  const [all, courts] = await Promise.all([getClosures(), getCourts()]);
  const td = todayKey(), h = manilaHour();
  const names = (c: Closure) => (c.court_ids.length === courts.length ? "All courts" : c.court_ids.map((id) => courts.find((x) => x.id === id)?.name ?? id).join(", "));
  const upcoming = all.filter((c) => (c.ends_on ?? NO_END) >= td).sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  const past = all.filter((c) => (c.ends_on ?? NO_END) < td).sort((a, b) => b.starts_on.localeCompare(a.starts_on));
  const rows = (l: Closure[], old: boolean): Row[] => l.map((c) => ({
    key: c.id, search: `${names(c)} ${c.category} ${c.note} ${fmtDate(c.starts_on)}`,
    cells: [
      <Fragment key="c">{names(c)}{!old && closureOn(c, td) && h >= c.start_hour && h < c.end_hour ? <> <span className="pill cancelled">closed now</span></> : null}</Fragment>,
      closureDatesText(c, fmtDate),
      c.all_day ? "All day" : `${fmtH(c.start_hour)} – ${fmtH(c.end_hour)}`,
      closureReason(c),
      <small key="b">{c.cancelled_count} cancelled<br /><span className="muted">by {c.created_by}</span></small>,
      old ? <span key="a" className="muted">—</span> : <ActBtn key="a" action={reopenClosureAction} fields={{ id: c.id }} label="Reopen" cls="btn-lime" />,
    ],
  }));
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <p className="muted" style={{ maxWidth: "68ch" }}>Close one or more courts for a whole day, several days, or a few hours, once or <b>every week on chosen days</b> (e.g. every Monday morning). Closed hours show as &quot;Closed&quot; on the booking page and can&apos;t be booked or waitlisted. Bookings already on those hours are cancelled with a 100% refund and each customer is emailed. Reopen removes a closure; bookings it cancelled stay cancelled.</p>
        <ModalButton label="+ Close courts" eyebrow="Closures" title="Close courts" wide>
          <ClosureForm courts={courts.map((c) => ({ id: c.id, name: c.name }))} today={td} />
        </ModalButton>
      </div>
      <div className="stack"><h2 style={{ fontSize: "1.1rem" }}>Upcoming &amp; active</h2>
        <DataTable head={["Courts", "Dates", "Hours", "Reason", "Bookings", "Actions"]} rows={rows(upcoming, false)} empty="No closures scheduled." /></div>
      {past.length ? <details><summary style={{ cursor: "pointer", fontWeight: 600 }}>Past closures ({past.length})</summary><div style={{ marginTop: 10 }}><DataTable head={["Courts", "Dates", "Hours", "Reason", "Bookings", ""]} rows={rows(past, true)} /></div></details> : null}
    </>
  );
}
