import Link from "next/link";
import { BookingTable, OrderTable } from "@/components/admin/BookingTables";
import { getBooking, groupByOrder, listBookings } from "@/lib/adminData";
import { bookingCards } from "@/components/admin/BookingDetail";
import BookingCards from "@/components/admin/BookingCards";
import type { BookingRow } from "@/lib/adminData";
import { getCounts } from "@/lib/adminNav";
import { isSuper, requireAdmin } from "@/lib/auth";
import { getCourts } from "@/lib/catalog";
import DashIntro from "@/components/admin/DashIntro";
import { peso } from "@/lib/format";
import { addDaysKey, todayKey } from "@/lib/time";

/* Dashboard (spec §7): to-review count, today's bookings, waitlist, revenue (super-admins).
   "View" on a row opens that booking as a card over the Dashboard (?view=<id>, v5.70) instead of going to Court Bookings.
   Every listed booking's card is rendered with the page (v5.74), so View opens it instantly (BookingCards). */
const viewCard = (id: string) => `/admin?view=${id}`;

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const admin = await requireAdmin();
  const { view } = await searchParams;
  const td = todayKey();
  const [c, courts, pending, verify, week] = await Promise.all([
    getCounts(), getCourts(), listBookings({ status: "pending" }), listBookings({ status: "verify" }), listBookings({ from: td, to: addDaysKey(td, 7) }),
  ]);
  const todays = week.filter((b) => b.date === td && ["pending", "awaiting", "verify", "approved"].includes(b.status))
    .sort((a, b) => a.hours[0] - b.hours[0]);
  const rev = week.filter((b) => b.status === "approved").reduce((a, b) => a + b.total, 0);
  const pendingG = groupByOrder(pending).slice(0, 5), verifyG = groupByOrder(verify).slice(0, 5);

  // the card for every booking a View link points at: the first booking of each listed order, and each of today's bookings
  // (plus ?view=<id> when the page is opened with one that isn't listed)
  const shown = new Map<string, { b: BookingRow; known?: BookingRow[] }>();
  [...pendingG, ...verifyG].forEach((l) => shown.set(l[0].id, { b: l[0], known: l }));
  todays.forEach((b) => { if (!shown.has(b.id)) shown.set(b.id, { b }); });
  if (view && !shown.has(view)) { const vb = await getBooking(view); if (vb) shown.set(vb.id, { b: vb }); }
  const cards = await bookingCards([...shown.values()], "/admin");
  return (
    <BookingCards cards={cards}>
      <DashIntro />
      <div className="stats">
        <div className="stat hot"><small>To review</small><b>{c.pending + c.verify}</b></div>
        <div className="stat"><small>Bookings today</small><b>{todays.length}</b></div>
        <div className="stat"><small>On waitlist</small><b>{c.waitlist}</b></div>
        {isSuper(admin) ? <div className="stat"><small>Approved · next 7 days</small><b>{peso(rev)}</b></div>
          : <div className="stat"><small>Class registrations to review</small><b>{c.cls.pending + c.cls.verify}</b></div>}
      </div>
      <div className="stack dash-sec">
        <div className="row dash-head" style={{ justifyContent: "space-between" }}><h2 style={{ fontSize: "1.1rem" }}>Requests to review</h2><Link className="linkbtn" href="/admin/bookings/pending">See all requests</Link></div>
        <OrderTable groups={pendingG} courts={courts} stage="pending" back="/admin" view={viewCard} />
      </div>
      <div className="stack dash-sec">
        <div className="row dash-head" style={{ justifyContent: "space-between" }}><h2 style={{ fontSize: "1.1rem" }}>Payments to verify</h2><Link className="linkbtn" href="/admin/bookings/verify">See all payments</Link></div>
        <OrderTable groups={verifyG} courts={courts} stage="verify" back="/admin" view={viewCard} />
      </div>
      <div className="stack dash-sec">
        <h2 className="dash-head" style={{ fontSize: "1.1rem" }}>Today on court</h2>
        {todays.length ? <BookingTable list={todays} courts={courts} view={viewCard} /> : <div className="empty">No bookings today yet.</div>}
      </div>
    </BookingCards>
  );
}
