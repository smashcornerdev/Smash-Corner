import type { Metadata } from "next";
import Link from "next/link";
import Countdown from "@/components/book/Countdown";
import PayForm from "@/components/book/PayForm";
import { PageTop, Pill } from "@/components/ui";
import { getActiveMethods, getCourts } from "@/lib/catalog";
import { readToken } from "@/lib/links";
import { getOrder, orderBookings } from "@/lib/flows/bookings";
import { loadReg } from "@/lib/flows/classes";
import { peso } from "@/lib/format";
import { fmtDate, fmtH, fmtRange, fmtTs } from "@/lib/time";
import type { RequestStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment", robots: { index: false } };

/* Payment page (spec §6 Pay after approval): opened from the approval email's signed link */
export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = readToken(token);
  if (!t || (t.k !== "pay-court" && t.k !== "pay-class")) {
    return (
      <>
        <PageTop eyebrow="Payment" title="Link expired" />
        <section className="wrap sec" style={{ paddingTop: 20 }}><div className="empty"><p>This payment link is no longer valid. Please <Link href="/contact">contact us</Link> if you need help.</p></div></section>
      </>
    );
  }
  let status: RequestStatus, lines: { label: React.ReactNode; total: number }[], refs: string[], email: string, due: string | null, what: string;
  if (t.k === "pay-court") {
    const order = await getOrder(t.id);
    const all = order ? await orderBookings(order.id) : [];
    if (!order || !all.length) return <section className="wrap sec"><h1>Not found</h1></section>;
    // open bookings of the order share one status; fall back to the first booking's
    const open = all.filter((b) => ["pending", "awaiting", "verify"].includes(b.status));
    const l = open.length ? open : all;
    const courts = await getCourts();
    status = l[0].status; refs = l.map((b) => b.ref); email = order.email; due = order.pay_due_at; what = "booking request";
    lines = l.map((b) => ({ label: <>{courts.find((c) => c.id === b.court_id)?.name}<br /><small>{fmtDate(b.date)} · {fmtRange(b.hours)}</small></>, total: b.total }));
  } else {
    const { r, k } = await loadReg(t.id);
    status = r.status; refs = [r.ref]; email = r.email; due = r.pay_due_at; what = "class registration";
    lines = [{ label: <>{k.title}<br /><small>{fmtDate(k.date)} · {fmtH(k.start_hour)} – {fmtH(k.end_hour)}</small></>, total: r.total }];
  }
  const total = lines.reduce((a, l) => a + l.total, 0);
  const aside = (
    <aside className="summary">
      <h4>Paying for</h4>
      {lines.map((l, i) => <div className="line" key={i}><span>{l.label}</span><span className="tabnum">{peso(l.total)}</span></div>)}
      <div className="line total"><span>Total</span><span className="tabnum">{peso(total)}</span></div>
      {status === "awaiting" && due ? <div className="banner lime" style={{ fontSize: ".82rem" }}>Pay within <b><Countdown until={due} /></b></div> : null}
    </aside>
  );
  if (status !== "awaiting" || (due && new Date(due).getTime() <= Date.now())) {
    const msg: Record<string, [string, React.ReactNode]> = {
      pending: ["Not approved yet", `Your ${what} is still being reviewed. We will email you the payment details once it is approved.`],
      verify: ["Payment received", <>We are checking your payment. We will email you at <b>{email}</b> once it is confirmed.</>],
      approved: ["All set", "This is paid and confirmed. See you on court!"],
      unpaid: ["This request expired", "We did not receive payment within 24 hours of approval, so the request expired and the time was released."],
      rejected: ["Not approved", `This ${what} was not approved.`],
      cancelled: ["Cancelled", "This was cancelled."],
      awaiting: ["Payment window ended", "The 24-hour payment window has ended. The request will expire shortly."],
    };
    const [title, body] = msg[status] ?? ["Nothing to pay", ""];
    return (
      <>
        <PageTop eyebrow="Payment" title={title} />
        <section className="wrap" style={{ paddingBlock: "24px 60px" }}>
          <div className="book-grid">
            <div className="panel">
              <div className="refs">{refs.map((r) => <span className="ref" key={r}>{r}</span>)}</div>
              <p className="lead">{body}</p>
              <div><Pill s={status} /></div>
              <div className="row"><Link href="/" className="btn btn-lime">Back to home</Link>{status === "unpaid" ? <Link href="/book" className="btn btn-ghost">Book again</Link> : null}</div>
            </div>
            {aside}
          </div>
        </section>
      </>
    );
  }
  const methods = (await getActiveMethods()).map((m) => ({ id: m.id, name: m.name, details: m.details, qr_url: m.qr_url }));
  return (
    <>
      <PageTop eyebrow="Payment" title="Pay & upload proof" lead={`Your ${what} is approved. Pay the exact total by ${fmtTs(due!)}, then upload your receipt. An admin will verify it and email your confirmation.`} />
      <section className="wrap" style={{ paddingBlock: "24px 60px" }}>
        <div className="book-grid">
          <PayForm token={token} methods={methods} total={total} refs={refs} />
          {aside}
        </div>
      </section>
    </>
  );
}
