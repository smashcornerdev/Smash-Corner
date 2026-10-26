import { notFound } from "next/navigation";
import { BookingTable, OrderTable } from "@/components/admin/BookingTables";
import { groupByOrder, listBookings } from "@/lib/adminData";
import { requireAdmin } from "@/lib/auth";
import { getCourts } from "@/lib/catalog";
import { todayKey } from "@/lib/time";
import type { RequestStatus } from "@/lib/types";

const NOTE: Record<string, string> = {
  pending: "New booking requests, newest first. Nothing has been paid yet. Approve to email the customer the payment details (they get 24 hours to pay), or reject. Bookings requested together in one checkout are grouped as one order.",
  awaiting: "Approved requests waiting for the customer to pay. If they don't pay within 24 hours of approval, the request expires on its own and the time is released.",
  verify: "The customer has paid and uploaded proof. Check the payment, then confirm the booking, or reject it (refunded in full).",
  approved: "Upcoming confirmed (paid and verified) bookings, newest booking first. Past bookings are counted in Reports.",
  rejected: "Rejected requests and payments, newest first.",
  cancelled: "Cancelled bookings, newest first.",
  unpaid: "Approved requests that were not paid within 24 hours. Their times were released.",
};

export default async function BookingsTab({ params }: { params: Promise<{ tab: string }> }) {
  await requireAdmin();
  const { tab } = await params;
  if (!(tab in NOTE)) notFound();
  const st = tab as RequestStatus;
  const [list, courts] = await Promise.all([listBookings({ status: st, from: st === "approved" ? todayKey() : undefined }), getCourts()]);
  const open = st === "pending" || st === "awaiting" || st === "verify";
  return (
    <>
      <p className="muted" style={{ fontSize: ".88rem", maxWidth: "80ch" }}>{NOTE[tab]}</p>
      {open ? <OrderTable groups={groupByOrder(list)} courts={courts} stage={st} back={`/admin/bookings/${tab}`} />
        : <BookingTable list={list} courts={courts} hist={st !== "approved"} />}
    </>
  );
}
