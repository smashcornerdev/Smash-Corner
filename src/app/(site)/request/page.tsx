import type { Metadata } from "next";
import Link from "next/link";
import RequestForm from "@/components/book/RequestForm";
import { PageTop } from "@/components/ui";
import { cartLines } from "@/lib/flows/cartview";
import { peso } from "@/lib/format";
import { sessionId } from "@/lib/session";
import { fmtDate, fmtRange } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking Request", robots: { index: false } };

/* Checkout step 1 (spec §6 Send request): nothing is paid until an admin approves the request */
export default async function RequestPage() {
  const lines = await cartLines(await sessionId());
  if (!lines.length) {
    return (
      <>
        <PageTop eyebrow="Booking request" title="Nothing to send" />
        <section className="wrap sec" style={{ paddingTop: 20 }}><div className="empty"><p>Your cart is empty.</p><Link href="/book" className="btn btn-lime">Book a court</Link></div></section>
      </>
    );
  }
  const total = lines.reduce((a, l) => a + l.total, 0);
  return (
    <>
      <PageTop eyebrow="Booking request" title="Send your booking request" lead="No payment yet. An admin reviews your request first. Once it's approved, we email you the payment details and you have 24 hours to pay." />
      <section className="wrap" style={{ paddingBlock: "24px 60px" }}>
        <div className="book-grid">
          <RequestForm free={total <= 0} />
          <aside className="summary">
            <h4>Requesting</h4>
            {lines.map((l) => <div className="line" key={l.id}><span>{l.court}<br /><small>{fmtDate(l.date)} · {fmtRange(l.hours)}</small></span><span className="tabnum">{peso(l.total)}</span></div>)}
            <div className="line total"><span>Total</span><span className="tabnum">{peso(total)}</span></div>
            {total > 0 ? <p className="muted" style={{ fontSize: ".78rem" }}>You pay this after your request is approved.</p> : null}
          </aside>
        </div>
      </section>
    </>
  );
}
