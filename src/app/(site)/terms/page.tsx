import type { Metadata } from "next";
import { PageTop } from "@/components/ui";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of Use", description: "Terms of use for the Smash Corner website and online booking.", alternates: { canonical: "/terms" } };

/* Draft wording for the client to review before launch. */
const PARAS = [
  "By using the Smash Corner website and booking system, you agree to these terms. Please read them together with our Booking Policy, which covers payments, cancellations and refunds.",
  "A booking made online is a request until it is confirmed. Your slot is reserved only after an admin approves the request and verifies your payment. The details you give must be accurate and belong to you or the person you are booking for.",
  "Court rates, equipment rental fees and class fees are shown in Philippine pesos at the time of booking. Prices and schedules may change, but a confirmed booking keeps the amount you paid.",
  "Players use the courts and equipment at their own risk and are expected to follow the on-court rules and staff instructions. Smash Corner may decline or cancel bookings that involve false information, unpaid balances or misuse of the facility.",
  "The text, logos and images on this website belong to Smash Corner and may not be copied or reused without permission. We work to keep the site accurate and available, but cannot guarantee it will be free of errors or interruptions.",
  `We may update these terms from time to time; the version on this page applies from the date it is posted. Questions about these terms can be sent to ${SITE.email}.`,
];

export default function Page() {
  return (
    <>
      <PageTop eyebrow="Terms" title="Terms of Use" lead="The terms that apply when you use our website and book courts, classes and equipment." />
      <section className="sec wrap stack" style={{ paddingTop: 12, maxWidth: 820 }}>
        {PARAS.map((p) => <p className="muted" key={p}>{p}</p>)}
      </section>
    </>
  );
}
