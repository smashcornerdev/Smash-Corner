import Link from "next/link";
import { notFound } from "next/navigation";
import EditBooking from "@/components/admin/EditBooking";
import Receipt from "@/components/admin/Receipt";
import ReasonForm, { ActBtn } from "@/components/admin/ReasonForm";
import { Pill } from "@/components/ui";
import { Arrow } from "@/components/art";
import { approveBookingAction, cancelBookingAction, rejectBookingAction } from "@/app/actions/admin";
import { getBooking } from "@/lib/adminData";
import { requireAdmin } from "@/lib/auth";
import { getCourts, getEquipment } from "@/lib/catalog";
import { orderBookings } from "@/lib/flows/bookings";
import { peso } from "@/lib/format";
import { equipmentText } from "@/lib/pricing";
import { fmtDate, fmtDateLong, fmtRange, fmtTs, hourTs, todayKey } from "@/lib/time";

const REQ_CHIPS = ["That time is no longer available.", "Too many players for this court.", "Please contact us to arrange this booking."];
const PAY_CHIPS = ["Proof of payment is unclear.", "Amount paid does not match the total.", "Payment was not received."];

/* Booking / order detail (spec §7): details, proof of payment, and the actions for its stage */
export default async function BookingView({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const b = await getBooking(id);
  if (!b) notFound();
  const [courts, items] = await Promise.all([getCourts(), getEquipment()]);
  const o = b.orders;
  const open = ["pending", "awaiting", "verify"].includes(b.status);
  const l = open ? await orderBookings(b.order_id, b.status) : [b];
  const total = l.reduce((a, x) => a + x.total, 0);
  const back = `/admin/bookings/view/${b.id}`;
  const cname = (cid: string) => courts.find((c) => c.id === cid)?.name ?? cid;
  const hrsToStart = (hourTs(b.date, b.hours[0]) - Date.now()) / 3600e3;
  const suggest = hrsToStart >= 48 ? 100 : hrsToStart >= 24 ? 50 : 0;

  return (
    <>
      <Link href={`/admin/bookings/${b.status}`} style={{ fontSize: ".88rem" }}><Arrow dir="l" /> Back to the list</Link>
      <div className="panel">
        <div className="modal-head">
          <div>
            <p className="eyebrow">{l.length > 1 ? `Order · ${l.length} bookings` : "Booking"}</p>
            <h2 style={{ fontSize: "1.3rem", marginTop: 6 }}>{l.map((x) => x.ref).join(", ")} <Pill s={b.status} /></h2>
          </div>
        </div>
        <div className="g2" style={{ alignItems: "start" }}>
          <dl className="detail">
            <dt>Customer</dt><dd>{b.name}</dd><dt>Number</dt><dd>{b.phone}</dd><dt>Email</dt><dd>{b.email}</dd>
            {l.length === 1 ? (
              <><dt>Court</dt><dd>{cname(b.court_id)}</dd><dt>Date</dt><dd>{fmtDateLong(b.date)}</dd><dt>Time</dt><dd>{fmtRange(b.hours)}</dd>
                <dt>Players</dt><dd>{b.players}</dd><dt>Equipment</dt><dd>{equipmentText(b.equipment, items)}</dd></>
            ) : null}
            <dt>{l.length > 1 ? "Order total" : "Total"}</dt><dd className="lime"><b>{peso(total)}</b></dd>
            <dt>Payment</dt><dd>{o.method_name ? `${o.method_name} · ${o.pay_ref}` : o.free ? "No payment needed" : "Not paid yet"}</dd>
            <dt>Requested</dt><dd>{fmtTs(b.created_at)}</dd>
            {o.approved_at ? <><dt>Approved</dt><dd>{fmtTs(o.approved_at)}</dd></> : null}
            {b.status === "awaiting" && o.pay_due_at ? <><dt>Pay by</dt><dd>{fmtTs(o.pay_due_at)}</dd></> : null}
            {o.paid_at ? <><dt>Paid</dt><dd>{fmtTs(o.paid_at)}</dd></> : null}
            {b.reason ? <><dt>Reason</dt><dd>{b.reason}</dd></> : null}
            {b.refund_pct != null ? <><dt>Refund</dt><dd>{b.refund_pct}%</dd></> : null}
          </dl>
          <div className="stack" style={{ gap: 8 }}><h4>Proof of payment</h4><Receipt path={o.proof_path} status={b.status} free={o.free} dueAt={o.pay_due_at} paidAt={o.paid_at} /></div>
        </div>
        {l.length > 1 ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Ref</th><th>Court</th><th>Date &amp; time</th><th className="num">Players</th><th>Equipment</th><th className="num">Total</th></tr></thead>
              <tbody>{l.map((x) => <tr key={x.id}><td><b>{x.ref}</b></td><td>{cname(x.court_id)}</td><td>{fmtDate(x.date)}<br /><small className="muted">{fmtRange(x.hours)}</small></td><td className="num">{x.players}</td><td><small>{equipmentText(x.equipment, items)}</small></td><td className="num">{peso(x.total)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : null}
        {open ? <p className="muted" style={{ fontSize: ".84rem" }}>One payment covers every booking in this order, so they&apos;re approved, paid and confirmed together. After they&apos;re confirmed, each booking can be edited or cancelled on its own.</p> : null}
        {b.status === "pending" || b.status === "verify" ? (
          <div className="row"><ActBtn action={approveBookingAction} fields={{ id: b.id, back }} label={b.status === "verify" ? "Confirm payment" : "Approve request"} small={false} /></div>
        ) : null}
      </div>

      {b.status === "pending" || b.status === "verify" ? (
        <div className="panel" id="reject">
          <h3>Reject {l.length > 1 ? `order · ${l.length} bookings` : b.ref}</h3>
          <ReasonForm action={rejectBookingAction} id={b.id} back={back} label="Reject" chips={b.status === "verify" ? PAY_CHIPS : REQ_CHIPS}
            note={`${l.length > 1 ? `All ${l.length} bookings are` : "The booking is"} rejected${b.status === "verify" ? " and refunded in full" : " (nothing was paid yet)"}, and the time opens up again. The waitlist is notified and the customer gets one email.`} />
        </div>
      ) : null}

      {b.status === "approved" ? (
        <>
          <div className="panel" id="edit">
            <h3>Edit / Reschedule</h3>
            {b.date >= todayKey() ? <EditBooking b={b} courts={courts} items={items} today={todayKey()} /> : <p className="muted">This booking has already been played.</p>}
          </div>
          <div className="panel" id="cancel">
            <h3>Cancel booking</h3>
            <ReasonForm action={cancelBookingAction} id={b.id} back={back} label="Cancel booking" required chips={["Customer request.", "Court maintenance.", "Weather."]}
              note="The slot is released and the waitlist is notified. The customer is emailed the reason and refund.">
              <div className="form-grid">
                <label className="f"><span>Cancelled by</span><select className="inp" name="by"><option value="customer">Customer request</option><option value="venue">Smash Corner (100% refund)</option></select></label>
                <label className="f"><span>Refund (policy suggests {suggest}%)</span>
                  <select className="inp" name="refund" defaultValue={String(suggest)}>
                    <option value="100">100% · {peso(b.total)}</option><option value="50">50% · {peso(Math.round(b.total / 2))}</option><option value="0">No refund</option>
                  </select>
                </label>
              </div>
            </ReasonForm>
          </div>
        </>
      ) : null}
    </>
  );
}
