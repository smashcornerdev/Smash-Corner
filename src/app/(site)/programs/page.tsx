import type { Metadata } from "next";
import Link from "next/link";
import { Ph, type Tone } from "@/components/art";
import PeTabs from "@/components/site/PeTabs";
import { PageTop, SecHead } from "@/components/ui";
import { getCourts } from "@/lib/catalog";
import { classesWithCounts, type ClassWithCounts } from "@/lib/flows/classes";
import { peso } from "@/lib/format";
import { fmtH, parseKey, weekday } from "@/lib/time";
import type { Court } from "@/lib/types";

export const metadata: Metadata = {
  title: "Programs & Events",
  description: "Tennis and pickleball programs, upcoming events and coaches at Smash Corner, Quezon City.",
  alternates: { canonical: "/programs" },
};
export const dynamic = "force-dynamic"; // v6.55: lists whatever the admin has open right now

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const when = (k: ClassWithCounts["k"]) => {
  const d = parseKey(k.date);
  return `${DAYS[weekday(k.date)]}, ${MONTHS[d.m - 1]} ${d.d} · ${fmtH(k.start_hour)} – ${fmtH(k.end_hour)}`;
};
const seats = ({ k, taken, state }: ClassWithCounts) =>
  state === "full" ? "Full" : `${Math.max(0, k.capacity - taken)} of ${k.capacity} spots left`;

/* Programs & Events (merged page, spec §2 v4.52): Programs, Upcoming events, Coaches with sticky jump tabs (PeTabs, v5.58).
   v6.55: Programs lists the classes and Events the events that the admin has open (Admin → Classes & Events → Open
   registration, Type: Class / Event), the same ones the Book page's Class / event tab offers: open, or full but still before
   the deadline. Closed, finished and cancelled ones drop off. An empty section shows a short message instead. */
export default async function ProgramsPage() {
  const [rows, courts] = await Promise.all([classesWithCounts({ bookable: true }), getCourts()]);
  const court = (id: string): Court | undefined => courts.find((c) => c.id === id);
  const programs = rows.filter((r) => r.k.kind !== "event"), events = rows.filter((r) => r.k.kind === "event");
  const meta = (r: ClassWithCounts) => `${court(r.k.court_id)?.name ?? r.k.court_id} · ${r.k.fee ? peso(r.k.fee) : "Free"} · ${seats(r)}`;
  const empty = (what: string) => (
    <div className="empty"><p>No {what} open right now. Check back soon.</p><Link href="/book" className="btn btn-ghost btn-sm">Book a court</Link></div>
  );
  return (
    <>
      <PageTop eyebrow="Programs & Events" title="Train, play, compete" lead="Clinics for new and returning players, regular community events and experienced coaches for tennis and pickleball." />
      <section className="sec wrap" style={{ paddingTop: 28 }}>
        <PeTabs />
        <SecHead id="pe-programs" eyebrow="Programs" title="Train with us" />
        {programs.length ? (
          <div className="g3">
            {programs.map((r, i) => (
              <article className="badge court-card" key={r.k.id}>
                <div className="in">
                  <Ph kind={court(r.k.court_id)?.type === "pickle" ? "pickle" : "tennis"} tone={(["lav", "lime", "dark"] as Tone[])[i % 3]} label={r.k.title} />
                  <div className="body">
                    <h3>{r.k.title}</h3>
                    <p className="lime" style={{ fontSize: ".88rem", fontWeight: 600 }}>{when(r.k)}</p>
                    <p className="muted" style={{ fontSize: ".86rem" }}>{meta(r)}</p>
                    {r.k.description ? <p className="muted" style={{ fontSize: ".9rem" }}>{r.k.description}</p> : null}
                    {r.state === "full"
                      ? <span className="btn btn-ghost btn-sm" aria-disabled="true">Full</span>
                      : <Link href="/book?mode=class" className="btn btn-ghost btn-sm">Register</Link>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : empty("classes")}

        <SecHead id="pe-events" eyebrow="Events" title="What's on" lead="Social nights, tournaments and clinics open to every level. Register online to reserve your spot." style={{ marginTop: 64 }} />
        {events.length ? (
          <div className="stack">
            {events.map((r, i) => {
              const d = parseKey(r.k.date);
              return (
                <article className="card" key={r.k.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center", padding: 18 }}>
                  <div className="clip" style={{ background: i % 2 ? "var(--lav)" : "var(--lime)", color: "var(--on-accent)", padding: "12px 16px", textAlign: "center", minWidth: 84 }}>
                    <div style={{ fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase" }}>{MONTHS[d.m - 1]}</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: "1.6rem", lineHeight: 1 }}>{d.d}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3>{r.k.title}</h3>
                    <p className="muted" style={{ fontSize: ".86rem", marginTop: 6 }}>{fmtH(r.k.start_hour)} – {fmtH(r.k.end_hour)} · {meta(r)}</p>
                    {r.k.description ? <p className="muted" style={{ fontSize: ".9rem", marginTop: 6 }}>{r.k.description}</p> : null}
                  </div>
                  {r.state === "full"
                    ? <span className="btn btn-ghost btn-sm" aria-disabled="true">Full</span>
                    : <Link href="/book?mode=class" className="btn btn-ghost btn-sm">Join</Link>}
                </article>
              );
            })}
          </div>
        ) : empty("events")}

        <SecHead id="pe-coaches" eyebrow="Coaches" title="Our coaches" style={{ marginTop: 64 }} />
        <div className="g3">
          {["Coach Paolo", "Coach Bea", "Coach Miguel"].map((n, i) => (
            <div className="person" key={n}>
              <h3>{n}</h3>
              <p className="muted" style={{ fontSize: ".9rem" }}>{["Tennis · 10 yrs", "Pickleball · 6 yrs", "Tennis & Pickleball · 8 yrs"][i]}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
