import type { Metadata } from "next";
import { PageTop } from "@/components/ui";

export const metadata: Metadata = { title: "Booking Policy", description: "Smash Corner booking, payment, cancellation and refund policy.", alternates: { canonical: "/policy" } };

/* Booking & Refund Policy (spec §17). Placeholder wording until the client supplies the final policy. */
const SECTIONS: [string, string[]][] = [
  ["Bookings", [
    "A booking request is reviewed by an admin first. Once it is approved, you get an email with the amount and payment details.",
    "Pay within 24 hours of approval. Unpaid requests expire and the time is released.",
    "Pay the exact amount shown and upload a clear proof of payment. A booking is only confirmed once an admin verifies your payment; you will receive a confirmation email.",
    "Items in the cart are held for 15 minutes. Admins review requests and payments within 24 hours (usually much sooner).",
  ]],
  ["Cancellations & Rescheduling", [
    "Customers cannot cancel or reschedule online. Please contact us; an admin will make the change.",
    "Rescheduling is free once per booking if requested at least 24 hours before the start time, subject to availability.",
    "Refunds for cancellations requested by the customer: 48 hours or more before start, 100%. 24–48 hours before start, 50%. Less than 24 hours or no-show, no refund.",
    "If Smash Corner cancels (maintenance, weather, emergencies), you get a full refund or a free reschedule.",
    "Rejected bookings are refunded in full within 3–5 business days, to the original payment method.",
  ]],
  ["On the Court", [
    "Please arrive 10 minutes early. Late arrival does not extend your booked time.",
    "Proper court shoes are required (non-marking soles).",
    "Rented equipment must be returned at the end of the booking; damaged or lost items will be charged.",
    "Maximum players per court as stated on the booking form.",
  ]],
];

export default function PolicyPage() {
  let n = 1;
  return (
    <>
      <PageTop eyebrow="Booking Policy" title="Booking & refund policy" lead="Placeholder wording. The final policy will be supplied by Smash Corner." />
      <section className="sec wrap" style={{ paddingTop: 12, maxWidth: 820 }}>
        {SECTIONS.map(([t, items]) => {
          const start = n;
          n += items.length;
          return (
            <div key={t}>
              <h3 style={{ marginTop: 28 }}>{t}</h3>
              <ol start={start} className="muted" style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 22, marginTop: 12, listStyle: "decimal" }}>
                {items.map((i) => <li key={i}>{i}</li>)}
              </ol>
            </div>
          );
        })}
      </section>
    </>
  );
}
