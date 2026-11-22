import { notFound } from "next/navigation";
import { BookingTable, OrderTable } from "@/components/admin/BookingTables";
import BookingCards from "@/components/admin/BookingCards";
import TabIntro from "@/components/admin/TabIntro";
import TabData from "@/components/admin/TabData";
import { SkelTable } from "@/components/admin/Skeleton";
import TableExport from "@/components/admin/TableExport";
import { bookingCards } from "@/components/admin/BookingDetail";
import { groupByOrder, listBookings } from "@/lib/adminData";
import { requireAdmin } from "@/lib/auth";
import { getCourts } from "@/lib/catalog";
import { blacklistMatcher, getBlacklist } from "@/lib/blacklist";
import { todayKey } from "@/lib/time";
import type { RequestStatus } from "@/lib/types";
import type { BookingRow } from "@/lib/adminData";

const NOTE: Record<string, string> = {
  pending: "New booking requests, newest first. Nothing has been paid yet. Approve to email the customer the payment details (they get 24 hours to pay), or reject. Bookings requested together in one checkout are grouped as one order. Requests from someone on the blacklist are listed separately below.",
  awaiting: "Approved requests waiting for the customer to pay. If they don't pay within 24 hours of approval, the request expires on its own and the time is released.",
  verify: "The customer has paid and uploaded proof. Check the payment, then confirm the booking, or reject it (refunded in full).",
  approved: "Upcoming confirmed (paid and verified) bookings, newest booking first. Past bookings are counted in Reports.",
  rejected: "Rejected requests and payments, newest first.",
  cancelled: "Cancelled bookings, newest first.",
  unpaid: "Approved requests that were not paid within 24 hours. Their times were released.",
};

/* Court Bookings tab (spec §7). Every row's booking card is rendered with the page (v5.76), so View opens it instantly over the
   list (?view=<id>) instead of going to the booking page; Reject still opens the booking page at its reject form.
   v6.01: the note is sent first, so switching tabs is instant; the table streams in after it (skeleton until then). */
export default async function BookingsTab({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  if (!(tab in NOTE)) notFound();
  const open = tab === "pending" || tab === "awaiting" || tab === "verify";
  return (
    <>
      <TabIntro tab={tab} />
      <p className="muted" style={{ fontSize: ".88rem", maxWidth: "80ch" }}>{NOTE[tab]}</p>
      <TabData tab={tab} fallback={<SkelTable cols={open ? 6 : 7} />}><BookingsData tab={tab as RequestStatus} /></TabData>
    </>
  );
}

async function BookingsData({ tab: st }: { tab: RequestStatus }) {
  await requireAdmin();
  const [list, courts, blacklist] = await Promise.all([listBookings({ status: st, from: st === "approved" ? todayKey() : undefined }), getCourts(), st === "pending" ? getBlacklist() : []]);
  const open = st === "pending" || st === "awaiting" || st === "verify";
  const back = `/admin/bookings/${st}`;
  const view = (id: string) => `${back}?view=${id}`;
  const all = open ? groupByOrder(list) : [];
  // Requests (v6.13): orders whose customer matches the blacklist (any of name, phone, email) get their own group below the rest
  const match = blacklistMatcher(blacklist);
  const hit = (b: BookingRow) => { const h = match(b); return h ? { on: h.on.map((x) => (x === "name" ? "full name" : x)), note: h.entry.note } : null; };
  const flagged = st === "pending" ? all.filter((l) => hit(l[0])) : [];
  const groups = all.filter((l) => !flagged.includes(l));
  const cards = await bookingCards(open ? all.map((l) => ({ b: l[0], known: l })) : list.map((b) => ({ b })), back);
  return (
    <BookingCards cards={cards}>
      {open ? <OrderTable groups={groups} courts={courts} stage={st as "pending" | "awaiting" | "verify"} back={back} view={view} tools={<TableExport courts={courts} />} />
        : <BookingTable list={list} courts={courts} hist={st !== "approved"} view={view} tools={<TableExport courts={courts} />} />}
      {flagged.length ? (
        <section className="bl-group" aria-labelledby="bl-h">
          <h3 id="bl-h">Blacklisted <span className="c">{flagged.length}</span></h3>
          <p className="muted" style={{ fontSize: ".86rem", maxWidth: "80ch", margin: 0 }}>These requests match someone on the blacklist (Management → Blacklist) by full name, phone or email. Check them before approving; you can still approve or reject them as usual.</p>
          <OrderTable groups={flagged} courts={courts} stage="pending" back={back} view={view} flag={hit} />
        </section>
      ) : null}
    </BookingCards>
  );
}
