import Link from "next/link";
import { Arrow, Icon, Ph, type Tone } from "@/components/art";
import { CourtCard } from "@/components/site/CourtCard";
import { SecHead } from "@/components/ui";
import { getCourts } from "@/lib/catalog";
import { L, SITE } from "@/lib/config";
import { maxBookKey, todayKey } from "@/lib/time";
import { GALLERY } from "@/lib/gallery";
import HeroIntro from "@/components/site/HeroIntro";
import SectionReveal from "@/components/site/SectionReveal";
import HeroDatePicker from "@/components/site/HeroDatePicker";
import HeroSport from "@/components/site/HeroSport";

export const dynamic = "force-dynamic";

/* Home: Hero · Courts Preview · Why Choose Us · Gallery Teaser · Testimonials · Final CTA (spec §3) */
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
        <SecHead eyebrow="Our Courts" title="Three courts. One corner." lead={L[1]} action={<Link href="/courts" className="btn btn-ghost btn-sm">Court details</Link>} />
        <div className="g3">{courts.map((c, i) => <CourtCard key={c.id} c={c} i={i} />)}</div>
      </section>

      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <SecHead eyebrow="Why Smash Corner" title="Why choose us" />
        <div className="g4">
          {[["bolt", "Book in minutes"], ["cal", "Open 7 AM daily"], ["light", "Night lights"], ["shield", "Verified bookings"]].map(([ic, t], i) => (
            <div className="feat" key={t}><Icon name={ic} className="ic" /><h3>{t}</h3><p className="muted">{L[(i + 2) % L.length]}</p></div>
          ))}
        </div>
      </section>

      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <SecHead eyebrow="Gallery" title="Take a look around" action={<Link href="/gallery" className="btn btn-ghost btn-sm">Full gallery</Link>} />
        <div className="teaser">
          {GALLERY.map((g, i) => (
            <Link key={g.id} href={`/gallery#g-${g.id}`} className="teaser-link" style={{ display: "flex", flexDirection: "column", gap: 8, color: "var(--fg)", textDecoration: "none" }}>
              <Ph kind={g.kind} tone={(["lav", "dark", "lime", "dark2"] as Tone[])[i]} label={g.name} />
              <span className="cap" style={{ fontWeight: 600, fontSize: ".92rem" }}>{g.name} <Arrow /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <SecHead eyebrow="Testimonials" title="Players say" />
        <div className="g3">
          {["Juan D.", "Maria S.", "Pedro R."].map((n, i) => (
            <blockquote className="quote" style={{ margin: 0 }} key={n}>
              <span className="stars" aria-label="5 stars">★★★★★</span>
              <p>“{L[(i + 3) % L.length]}”</p>
              <footer><strong>{n}</strong>{["Pickleball regular", "Tennis player", "Weekend league"][i]}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 40 }}>
        <div className="cta-band dk">
          <div className="stack" style={{ gap: 10 }}><h2>Ready to play?</h2><p>{L[4]}</p></div>
          <Link href="/book" className="btn btn-lime no-edge">Book a Court</Link>
        </div>
      </section>
    </>
  );
}
