import Link from "next/link";
import { notFound } from "next/navigation";
import BookingDetail, { bookingDetailData } from "@/components/admin/BookingDetail";
import { Pill } from "@/components/ui";
import { Arrow } from "@/components/art";
import { getBooking } from "@/lib/adminData";
import { requireAdmin } from "@/lib/auth";

/* Booking / order detail page (spec §7). The body is shared with the Dashboard's "View" card (BookingDetail). */
export default async function BookingView({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const b = await getBooking(id);
  if (!b) notFound();
  const { l } = await bookingDetailData(b);
  return (
    <>
      <Link href={`/admin/bookings/${b.status}`} style={{ fontSize: ".88rem" }}><Arrow dir="l" /> Back to the list</Link>
      <BookingDetail b={b} back={`/admin/bookings/view/${b.id}`} head={
        <div className="modal-head">
          <div>
            <p className="eyebrow">{l.length > 1 ? `Order · ${l.length} bookings` : "Booking"}</p>
            <h2 style={{ fontSize: "1.3rem", marginTop: 6 }}>{l.map((x) => x.ref).join(", ")} <Pill s={b.status} /></h2>
          </div>
        </div>
      } />
    </>
  );
}
