import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/art";
import ContactForm from "@/components/site/ContactForm";
import { PageTop, SecHead } from "@/components/ui";
import { L, SITE } from "@/lib/config";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Smash Corner in Quezon City: address, hours, phone, email and answers to common questions.",
  alternates: { canonical: "/contact" },
};

/* Contact: form + map & hours, then the FAQ accordion (spec §2, v4.60) */
export default function ContactPage() {
  const map = process.env.NEXT_PUBLIC_MAP_EMBED_URL;
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <PageTop eyebrow="Contact" title="Get in touch" lead={L[1]} />
      <section className="sec wrap" style={{ paddingTop: 28 }}>
        <div className="g2" style={{ alignItems: "start" }}>
          <ContactForm />
          <div className="stack">
            {map ? (
              <iframe src={map} title="Map to Smash Corner" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                style={{ width: "100%", aspectRatio: "16/11", border: 0, borderRadius: 14 }} />
            ) : (
              <div className="ph t-dark2" role="img" aria-label="Map placeholder" style={{ aspectRatio: "16/11" }}>
                <svg viewBox="0 0 400 300" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path d="M0 80h400M0 190h400M120 0v300M290 0v300M0 260 400 30" stroke="var(--text-muted)" />
                  <path d="M200 110c-22 0-38 16-38 37 0 28 38 63 38 63s38-35 38-63c0-21-16-37-38-37z" strokeWidth={4} stroke="var(--lime)" />
                  <circle cx="200" cy="148" r="11" stroke="var(--lime)" strokeWidth={4} />
                </svg>
                <span className="ph-tag">Map placeholder</span>
              </div>
            )}
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
        <div className="stack" style={{ gap: 8, maxWidth: 860 }}>
          {FAQ.map(([q, a]) => (
            <details className="card" style={{ padding: 0 }} key={q}>
              <summary style={{ padding: "16px 18px", cursor: "pointer", fontWeight: 600 }}>{q}</summary>
              <p className="muted" style={{ padding: "0 18px 18px" }}>{a}</p>
            </details>
          ))}
        </div>
        <p style={{ marginTop: 20 }}><Link href="/policy">Read the full Booking Policy <Arrow /></Link></p>
      </section>
    </>
  );
}
