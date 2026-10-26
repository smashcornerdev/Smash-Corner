import type { Metadata } from "next";
import Link from "next/link";
import { getCourts } from "@/lib/catalog";
import { getOrder, orderBookings } from "@/lib/flows/bookings";
import { peso } from "@/lib/format";
import { fmtDate, fmtRange } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Request Sent", robots: { index: false } };

/* "Request sent" confirmation (spec §6): reference numbers + what happens next */
export default async function DonePage({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  const { o } = await searchParams;
  const order = o && /^[0-9a-f-]{36}$/.test(o) ? await getOrder(o) : null;
  const list = order ? await orderBookings(order.id) : [];
  if (!order || !list.length) {
    return <section className="wrap sec stack" style={{ alignItems: "flex-start" }}><h1>No recent booking</h1><Link href="/book" className="btn btn-lime">Book a court</Link></section>;
  }
  const courts = await getCourts();
  return (
    <section className="wrap sec">
      <div className="done-hero">
        <p className="eyebrow">Submitted</p>
        <h1>Request sent</h1>
        <div className="refs">{list.map((b) => <span className="ref" key={b.id}>{b.ref}</span>)}</div>
        <p className="lead">
          Your booking request is <span className="pill pending">Pending</span>.{" "}
          {order.free
            ? <>An admin will review it and email you at <b>{order.email}</b> once it is confirmed (no payment needed).</>
            : <>An admin will review it and email you at <b>{order.email}</b> with the payment details once it is approved. You will then have <b>24 hours</b> to pay.</>}
        </p>
        <div className="stack card" style={{ padding: 18, gap: 8 }}>
          {list.map((b) => (
            <div className="row" style={{ justifyContent: "space-between" }} key={b.id}>
              <span>{courts.find((c) => c.id === b.court_id)?.name} · {fmtDate(b.date)} · {fmtRange(b.hours)}</span>
              <b className="lime tabnum">{peso(b.total)}</b>
            </div>
          ))}
        </div>
        <div className="banner">To cancel or reschedule, <Link href="/contact">contact us</Link>. Online cancellation is not available.</div>
        <div className="row"><Link href="/" className="btn btn-lime">Back to home</Link></div>
      </div>
    </section>
  );
}
