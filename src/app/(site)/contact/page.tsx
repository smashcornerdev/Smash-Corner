import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/art";
import ContactForm from "@/components/site/ContactForm";
import FaqList from "@/components/site/FaqList";
import { PageTop, SecHead } from "@/components/ui";
import { SITE } from "@/lib/config";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Smash Corner in Quezon City: address, hours, phone, email and answers to common questions.",
  alternates: { canonical: "/contact" },
};

/* Contact: form + map & hours, then the FAQ accordion (spec §2, v4.60) */
export default function ContactPage() {
  const map = process.env.NEXT_PUBLIC_MAP_EMBED_URL || SITE.mapEmbed;
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <PageTop eyebrow="Contact" title="Get in touch" lead="Questions about bookings, programs or private events? Send us a message or call, and our team will get back to you." />
      <section className="sec wrap" style={{ paddingTop: 28 }}>
        <div className="g2" style={{ alignItems: "start" }}>
          <ContactForm />
          <div className="stack">
            <iframe src={map} title="Map to Smash Corner" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen
              style={{ width: "100%", aspectRatio: "16/11", border: 0, borderRadius: 14 }} />
            <dl className="spec" style={{ fontSize: ".95rem" }}>
              <dt>Address</dt><dd>{SITE.address}</dd>
              <dt>Hours</dt><dd>{SITE.hours}</dd>
              <dt>Phone</dt><dd>{SITE.phone}</dd>
              <dt>Email</dt><dd>{SITE.email}</dd>
            </dl>
          </div>
        </div>
      </section>
      <section className="sec wrap" id="faq-sec" style={{ paddingTop: 8 }}>
        <SecHead eyebrow="FAQ" title="Questions, answered" />
        <FaqList items={FAQ} />
        <p style={{ marginTop: 20 }}><Link href="/policy">Read the full Booking Policy <Arrow /></Link></p>
      </section>
    </>
  );
}
