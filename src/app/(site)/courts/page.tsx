import type { Metadata } from "next";
import { Icon } from "@/components/art";
import { CourtCard } from "@/components/site/CourtCard";
import { PageTop, SecHead } from "@/components/ui";
import { getCourts } from "@/lib/catalog";
import { L } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Courts",
  description: "Tennis Court 1 and Pickleball Courts 1 & 2 in Quezon City: surfaces, sizes, player limits and hourly rates.",
  alternates: { canonical: "/courts" },
};

export default async function CourtsPage() {
  const courts = await getCourts();
  return (
    <>
      <PageTop eyebrow="Courts" title="Pick your surface" lead={L[1]} />
      <section className="sec wrap" style={{ paddingTop: 28 }}>
        <div className="g3">{courts.map((c, i) => <CourtCard key={c.id} c={c} i={i} specs />)}</div>
      </section>
      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <SecHead eyebrow="Facilities & Amenities" title="Everything off court" />
        <div className="g3">
          {[["park", "Parking"], ["shower", "Shower & Bathrooms"], ["lock", "Lockers"], ["cup", "Drinks & Snacks"], ["wifi", "Free Wi-Fi"], ["seat", "Waiting Lounge"]].map(([ic, t], i) => (
            <div className="amen" key={t}>
              <Icon name={ic} />
              <div><h4>{t}</h4><p className="muted" style={{ fontSize: ".9rem", marginTop: 4 }}>{L[i % L.length].slice(0, 70)}.</p></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
