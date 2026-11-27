import Link from "next/link";
import { Arrow, Icon } from "@/components/art";
import { CourtCard } from "@/components/site/CourtCard";
import { SecHead } from "@/components/ui";
import { getCourts } from "@/lib/catalog";
import { SITE } from "@/lib/config";
import { maxBookKey, todayKey } from "@/lib/time";
import { GALLERY, driveImg } from "@/lib/gallery";
import HeroIntro from "@/components/site/HeroIntro";
import SectionReveal from "@/components/site/SectionReveal";
import HeroDatePicker from "@/components/site/HeroDatePicker";
import HeroSport from "@/components/site/HeroSport";

export const dynamic = "force-dynamic";

/* Home: Hero · Courts Preview · Why Choose Us · Gallery Teaser · Final CTA (spec §3) */
export default async function Home() {
  const courts = await getCourts();
  const t0 = todayKey();
  const jsonLd = {
    "@context": "https://schema.org", "@type": "SportsActivityLocation", name: "Smash Corner", url: SITE.url,
    address: { "@type": "PostalAddress", streetAddress: SITE.address, addressLocality: "Quezon City", addressCountry: "PH" },
    telephone: SITE.phone, email: SITE.email,
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "07:00", closes: "22:00" }],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HeroIntro />
      <SectionReveal />
      <div className="hero-band">
        <section className="hero wrap">
          <div>
            <h1 style={{ marginTop: 14 }}>
              <span className="ln">It all begins with a ball.</span>
              <span className="ln l">Life’s a court.</span>
              <span className="ln shine">Play it.</span>
            </h1>
            <p className="lead">Tennis and pickleball courts in Quezon City. Book in under a minute.</p>
            {/* search bar (v5.29): sport + date → the Book page. Plain GET form, so it works without JavaScript */}
            <form className="quick" action="/book" method="get" aria-label="Check court availability">
              <HeroSport />
              <HeroDatePicker today={t0} max={maxBookKey()} />
              <button className="btn btn-lime no-edge" type="submit">Check availability <Arrow /></button>
            </form>
            <ul className="hero-facts">
              <li><Icon name="pin" />Quezon City</li>
              <li><Icon name="clock" />Open 7 AM daily</li>
              <li><Icon name="box" />Rackets and balls for rent</li>
            </ul>
          </div>
        </section>
      </div>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {["Tennis", "Pickleball", "Open 7 AM daily", "Book online", "Rent equipment", "Quezon City"].map((t) => <span key={t}>{t}</span>)}
        </div>
      </div>

      <section className="sec wrap">
        <SecHead eyebrow="Our Courts" title="Three courts. One corner." lead="A full-size tennis court and two pickleball courts, each bookable by the hour from 7 AM to 10 PM." action={<Link href="/courts" className="btn btn-ghost btn-sm">Court details</Link>} />
        <div className="g3">{courts.map((c, i) => <CourtCard key={c.id} c={c} i={i} />)}</div>
      </section>

      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <SecHead eyebrow="Why Smash Corner" title="Why choose us" />
        <div className="g4">
          {[
            ["bolt", "Book in minutes", "Pick a court, date and time online and send your request. No account or phone call needed."],
            ["cal", "Open 7 AM daily", "Courts run from 7:00 AM to 10:00 PM every day, so early sessions and after-work games both fit."],
            ["light", "Night lights", "Every court is fully lit until closing, giving evening players clear sight lines from baseline to net."],
            ["shield", "Verified bookings", "Our team checks each request and confirms it by email, so your slot is ready when you arrive."],
          ].map(([ic, t, d]) => (
            <div className="feat" key={t}><Icon name={ic} className="ic" /><h3>{t}</h3><p className="muted">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <SecHead eyebrow="Gallery" title="Take a look" action={<Link href="/gallery" className="btn btn-ghost btn-sm">Full gallery</Link>} />
        <div className="teaser">
          {/* first 4 gallery photos (v6.52; the Gallery no longer has sections to link to) */}
          {GALLERY.slice(0, 4).map((g, i) => (
            <Link key={g.id} href="/gallery" className="teaser-link" aria-label={`Gallery photo ${i + 1}`} style={{ display: "block" }}>
              <img className="teaser-img" loading="lazy" decoding="async" referrerPolicy="no-referrer" src={driveImg(g.id, 600)} alt={`Smash Corner photo ${i + 1}`} />
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 40 }}>
        <div className="cta-band dk">
          <div className="stack" style={{ gap: 10 }}><h2>Ready to play?</h2><p>Choose your court and time online. We will email you as soon as your request is approved.</p></div>
          <Link href="/book" className="btn btn-lime no-edge">Book a Court</Link>
        </div>
      </section>
    </>
  );
}
