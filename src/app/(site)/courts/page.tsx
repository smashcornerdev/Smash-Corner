import type { Metadata } from "next";
import { Icon } from "@/components/art";
import { CourtCard } from "@/components/site/CourtCard";
import { PageTop, SecHead } from "@/components/ui";
import { getCourts } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Courts",
  description: "Tennis Court 1 and Pickleball Courts 1 & 2 in Quezon City: player limits and hourly rates.",
  alternates: { canonical: "/courts" },
};

export default async function CourtsPage() {
  const courts = await getCourts();
  return (
    <>
      <PageTop eyebrow="Courts" title="Pick your surface" lead="One tennis court and two pickleball courts, all lit for evening play. Compare player limits and rates, then book the one that suits your game." />
      <section className="sec wrap" style={{ paddingTop: 28 }}>
        <div className="g3">{courts.map((c, i) => <CourtCard key={c.id} c={c} i={i} specs />)}</div>
      </section>
      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <SecHead eyebrow="Facilities & Amenities" title="Everything off court" />
        <div className="g3">
          {[
            ["park", "Parking", "On-site parking for players and guests during your booking."],
            ["shower", "Shower & Bathrooms", "Clean showers and restrooms to freshen up after a game."],
            ["wifi", "Free Wi-Fi", "Complimentary Wi-Fi across the courts and lounge."],
            ["seat", "Waiting Lounge", "A shaded seating area to rest between games or watch a match."],
          ].map(([ic, t, d]) => (
            <div className="amen" key={t}>
              <Icon name={ic} />
              <div><h4>{t}</h4><p className="muted" style={{ fontSize: ".9rem", marginTop: 4 }}>{d}</p></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
