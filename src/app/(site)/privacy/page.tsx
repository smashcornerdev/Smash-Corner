import type { Metadata } from "next";
import { PageTop } from "@/components/ui";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy", description: "How Smash Corner collects and uses your personal data.", alternates: { canonical: "/privacy" } };

/* Draft wording for the client to review before launch (Data Privacy Act of 2012 compliance). */
const PARAS = [
  "Smash Corner respects your privacy and handles personal data in line with the Data Privacy Act of 2012 (Republic Act No. 10173). This policy explains what we collect when you use our website, why we collect it and how we keep it safe.",
  "When you book a court, join a waitlist or register for a class, we collect your name, mobile number and email address. Class registrations also ask for a nickname and age. When you pay, we collect the payment reference and the proof of payment you upload. Messages sent through our contact form include the details you choose to share.",
  "We use this information only to process and confirm bookings, verify payments, send booking updates and reminders, manage waitlists, issue refunds and reply to your enquiries. We do not sell your data or use it for advertising.",
  "Your data is stored with service providers that help us run the website, send email and keep booking records, and they process it only on our behalf. Within Smash Corner, access is limited to the staff who manage bookings.",
  "We keep booking records for as long as we need them to provide our services and meet accounting and legal requirements. Records we no longer need are deleted or anonymised.",
  `You may ask to access, correct or delete your personal data, or object to how it is used, by emailing ${SITE.email}. You also have the right to file a complaint with the National Privacy Commission.`,
];

export default function Page() {
  return (
    <>
      <PageTop eyebrow="Privacy" title="Privacy Policy" lead="How we collect, use and protect the personal information you share with us." />
      <section className="sec wrap stack" style={{ paddingTop: 12, maxWidth: 820 }}>
        {PARAS.map((p) => <p className="muted" key={p}>{p}</p>)}
      </section>
    </>
  );
}
