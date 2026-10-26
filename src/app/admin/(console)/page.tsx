import Link from "next/link";
import { BookingTable, OrderTable } from "@/components/admin/BookingTables";
import { groupByOrder, listBookings } from "@/lib/adminData";
import { getCounts } from "@/lib/adminNav";
import { isSuper, requireAdmin } from "@/lib/auth";
import { getCourts } from "@/lib/catalog";
import { peso } from "@/lib/format";
import { addDaysKey, todayKey } from "@/lib/time";

/* Dashboard (spec §7): to-review count, today's bookings, waitlist, revenue (super-admins) */
export default async function Dashboard() {
  const admin = await requireAdmin();
  const td = todayKey();
  const [c, courts, pending, verify, week] = await Promise.all([
    getCounts(), getCourts(), listBookings({ status: "pending" }), listBookings({ status: "verify" }), listBookings({ from: td, to: addDaysKey(td, 7) }),
  ]);
  const todays = week.filter((b) => b.date === td && ["pending", "awaiting", "verify", "approved"].includes(b.status))
    .sort((a, b) => a.hours[0] - b.hours[0]);
  const rev = week.filter((b) => b.status === "approved").reduce((a, b) => a + b.total, 0);
  return (
    <>
      <div className="stats">
        <div className="stat hot"><small>To review</small><b>{c.pending + c.verify}</b></div>
        <div className="stat"><small>Bookings today</small><b>{todays.length}</b></div>
        <div className="stat"><small>On waitlist</small><b>{c.waitlist}</b></div>
        {isSuper(admin) ? <div className="stat"><small>Approved · next 7 days</small><b>{peso(rev)}</b></div>
          : <div className="stat"><small>Class registrations to review</small><b>{c.cls.pending + c.cls.verify}</b></div>}
      </div>
      <div className="stack">
        <div className="row" style={{ justifyContent: "space-between" }}><h2 style={{ fontSize: "1.1rem" }}>Requests to review</h2><Link className="linkbtn" href="/admin/bookings/pending">See all requests</Link></div>
        <OrderTable groups={groupByOrder(pending).slice(0, 5)} courts={courts} stage="pending" back="/admin" />
      </div>
      <div className="stack">
        <div className="row" style={{ justifyContent: "space-between" }}><h2 style={{ fontSize: "1.1rem" }}>Payments to verify</h2><Link className="linkbtn" href="/admin/bookings/verify">See all payments</Link></div>
        <OrderTable groups={groupByOrder(verify).slice(0, 5)} courts={courts} stage="verify" back="/admin" />
      </div>
      <div className="stack">
        <h2 style={{ fontSize: "1.1rem" }}>Today on court</h2>
        {todays.length ? <BookingTable list={todays} courts={courts} /> : <div className="empty">No bookings today yet.</div>}
      </div>
    </>
  );
}
