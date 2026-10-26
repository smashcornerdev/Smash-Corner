import { Fragment } from "react";
import Link from "next/link";
import DataTable, { type Row } from "./DataTable";
import { ActBtn } from "./ReasonForm";
import { Pill } from "@/components/ui";
import { approveBookingAction } from "@/app/actions/admin";
import { peso } from "@/lib/format";
import { ago, fmtDate, fmtRange, fmtTs } from "@/lib/time";
import type { BookingRow } from "@/lib/adminData";
import type { Court } from "@/lib/types";

const cname = (courts: Court[], id: string) => courts.find((c) => c.id === id)?.name ?? id;

/* Requests / Awaiting payment / Verify payment: one row per order (spec §7 Orders) */
export function OrderTable({ groups, courts, stage, back }: { groups: BookingRow[][]; courts: Court[]; stage: "pending" | "awaiting" | "verify"; back: string }) {
  const empty = { pending: "No new requests.", awaiting: "No one is waiting to pay.", verify: "No payments to check." }[stage];
  const rows: Row[] = groups.map((l) => {
    const b = l[0], o = b.orders, tot = l.reduce((a, x) => a + x.total, 0);
    return {
      key: b.order_id,
      search: [b.name, b.email, b.phone, ...l.map((x) => `${x.ref} ${cname(courts, x.court_id)} ${fmtDate(x.date)}`)].join(" "),
      cells: [
        <Fragment key="ref">{l.map((x) => <div key={x.id}><b style={{ whiteSpace: "nowrap" }}>{x.ref}</b></div>)}</Fragment>,
        <Fragment key="cust">{b.name}<br /><small className="muted">{b.email}</small></Fragment>,
        <Fragment key="courts">{l.map((x) => <div key={x.id} style={{ marginBottom: 6 }}>{cname(courts, x.court_id)}<br /><small className="muted">{fmtDate(x.date)} · {fmtRange(x.hours)} · {x.players} player{x.players === 1 ? "" : "s"}</small></div>)}</Fragment>,
        <Fragment key="total">{peso(tot)}{l.length > 1 ? <><br /><small className="muted">{l.map((x) => peso(x.total)).join(" + ")}</small></> : null}</Fragment>,
        stage === "pending" ? <Fragment key="pay">{o.free ? "No payment needed" : "Pays after approval"}<br /><small className="muted">Requested {ago(b.created_at)}</small></Fragment>
          : stage === "awaiting" ? <Fragment key="pay">Not paid yet<br /><small className="muted">Due {o.pay_due_at ? fmtTs(o.pay_due_at) : "—"}</small></Fragment>
          : <Fragment key="pay">{o.method_name}<br /><small className="muted">{o.pay_ref} · paid {o.paid_at ? ago(o.paid_at) : ""}</small></Fragment>,
        <div className="acts" key="a">
          <Link className="btn btn-ghost btn-sm" href={`/admin/bookings/view/${b.id}`}>View</Link>
          {stage !== "awaiting" ? (
            <>
              <ActBtn action={approveBookingAction} fields={{ id: b.id, back }} label={stage === "verify" ? "Confirm payment" : "Approve"} />
              <Link className="btn btn-danger btn-sm" href={`/admin/bookings/view/${b.id}#reject`}>Reject</Link>
            </>
          ) : null}
        </div>,
      ],
    };
  });
  return <DataTable head={["Ref", "Customer", "Courts & times", "Total", "Payment", "Actions"]} num={[3]} rows={rows} empty={empty} />;
}

/* Approved / Rejected / Cancelled / Unpaid / today: one row per booking */
export function BookingTable({ list, courts, hist }: { list: BookingRow[]; courts: Court[]; hist?: boolean }) {
  const rows: Row[] = list.map((b) => ({
    key: b.id,
    search: `${b.ref} ${b.name} ${b.email} ${b.phone} ${cname(courts, b.court_id)} ${fmtDate(b.date)}`,
    cells: [
      <Fragment key="ref"><b>{b.ref}</b>{b.edited ? <><br /><span className="pill edited" style={{ marginTop: 4 }}>edited</span></> : null}</Fragment>,
      <Fragment key="cust">{b.name}<br /><small className="muted">{b.email}</small></Fragment>,
      <Fragment key="court">{cname(courts, b.court_id)}<br /><small className="muted">{b.players} players</small></Fragment>,
      <Fragment key="date">{fmtDate(b.date)}<br /><small className="muted">{fmtRange(b.hours)}</small></Fragment>,
      peso(b.total),
      hist ? <small key="status" style={{ maxWidth: 260, display: "block" }}>{b.reason}{b.refund_pct != null ? <><br />Refund: {b.refund_pct}%</> : null}</small>
        : <Fragment key="status"><Pill s={b.status} /><br /><small className="muted">{b.orders.method_name ?? (b.orders.free ? "No payment needed" : "Not paid yet")}</small></Fragment>,
      <div className="acts" key="a"><Link className="btn btn-ghost btn-sm" href={`/admin/bookings/view/${b.id}`}>View</Link>
        {b.status === "approved" ? <><Link className="btn btn-lav btn-sm" href={`/admin/bookings/view/${b.id}#edit`}>Edit</Link><Link className="btn btn-danger btn-sm" href={`/admin/bookings/view/${b.id}#cancel`}>Cancel</Link></> : null}</div>,
    ],
  }));
  return <DataTable head={["Ref", "Customer", "Court", "Date & time", "Total", hist ? "Reason" : "Status", "Actions"]} num={[4]} rows={rows} />;
}
