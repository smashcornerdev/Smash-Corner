import type { Metadata } from "next";
import Link from "next/link";
import CartList from "@/components/book/CartList";
import { PageTop } from "@/components/ui";
import { cartLines } from "@/lib/flows/cartview";
import { peso } from "@/lib/format";
import { sessionId } from "@/lib/session";
import { fmtDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Cart", robots: { index: false } };

export default async function CartPage() {
  const lines = await cartLines(await sessionId());
  if (!lines.length) {
    return (
      <>
        <PageTop eyebrow="Cart" title="Your cart" />
        <section className="wrap sec" style={{ paddingTop: 20 }}><div className="empty"><p>Your cart is empty.</p><Link href="/book" className="btn btn-lime">Book a court</Link></div></section>
      </>
    );
  }
  const total = lines.reduce((a, l) => a + l.total, 0);
  return (
    <>
      <PageTop eyebrow="Cart" title="Your cart" lead="Each slot is held for you until its timer runs out." />
      <section className="wrap" style={{ paddingBlock: "24px 60px" }}>
        <div className="book-grid">
          <CartList lines={lines} />
          <aside className="summary">
            <h4>Order total</h4>
            {lines.map((l) => <div className="line" key={l.id}><span>{l.court}<br /><small>{fmtDate(l.date)}</small></span><span className="tabnum">{peso(l.total)}</span></div>)}
            <div className="line total"><span>Total</span><span className="tabnum">{peso(total)}</span></div>
            <Link href="/request" className="btn btn-lime">Continue to request</Link>
            <p className="muted" style={{ fontSize: ".78rem" }}>No payment yet. You pay after an admin approves your request.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
