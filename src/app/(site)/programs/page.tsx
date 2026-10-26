import type { Metadata } from "next";
import Link from "next/link";
import { Ph, type Tone } from "@/components/art";
import { PageTop, SecHead } from "@/components/ui";
import { L } from "@/lib/config";
import { addDaysKey, parseKey, todayKey } from "@/lib/time";

export const metadata: Metadata = {
  title: "Programs & Events",
  description: "Tennis and pickleball programs, upcoming events and coaches at Smash Corner, Quezon City.",
  alternates: { canonical: "/programs" },
};
export const revalidate = 3600; // event dates are relative to today

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* Programs & Events (merged page, spec §2 v4.52): Programs, Upcoming events, Coaches with jump buttons */
export default function ProgramsPage() {
  const events: [string, number][] = [["Pickleball Social Night", 5], ["Lorem Ipsum Open (Tennis)", 12], ["Doubles Mixer", 19], ["Junior Rally Day", 26]];
  return (
    <>
      <PageTop eyebrow="Programs & Events" title="Train, play, compete" lead={L[4]} />
      <section className="sec wrap" style={{ paddingTop: 28 }}>
        <nav className="chips" style={{ marginBottom: 28 }} aria-label="On this page">
          <a className="chip" href="#pe-programs">Programs</a>
          <a className="chip" href="#pe-events">Upcoming events</a>
          <a className="chip" href="#pe-coaches">Coaches</a>
        </nav>
        <SecHead id="pe-programs" eyebrow="Programs" title="Train with us" />
        <div className="g3">
          {[["Junior Tennis Clinic", "Ages 7–15 · Sat 8 AM"], ["Pickleball 101", "Beginners · Tue & Thu 6 PM"], ["Adult Tennis Drills", "Intermediate · Sun 7 AM"]].map(([t, s], i) => (
            <article className="badge court-card" key={t}>
              <div className="in">
                <Ph kind={i === 1 ? "pickle" : "tennis"} tone={(["lav", "lime", "dark"] as Tone[])[i]} label={t} />
                <div className="body">
                  <h3>{t}</h3>
                  <p className="lime" style={{ fontSize: ".88rem", fontWeight: 600 }}>{s}</p>
                  <p className="muted" style={{ fontSize: ".9rem" }}>{L[i]}</p>
                  <Link href="/contact" className="btn btn-ghost btn-sm">Ask about this program</Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <SecHead id="pe-events" eyebrow="Events" title="What's on" lead={L[5]} style={{ marginTop: 64 }} />
        <div className="stack">
          {events.map(([t, n], i) => {
            const d = parseKey(addDaysKey(todayKey(), n));
            return (
              <article className="card" key={t} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center", padding: 18 }}>
                <div className="clip" style={{ background: i % 2 ? "var(--lav)" : "var(--lime)", color: "var(--on-accent)", padding: "12px 16px", textAlign: "center", minWidth: 84 }}>
                  <div style={{ fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase" }}>{MONTHS[d.m - 1]}</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: "1.6rem", lineHeight: 1 }}>{d.d}</div>
                </div>
                <div style={{ minWidth: 0 }}><h3>{t}</h3><p className="muted" style={{ fontSize: ".9rem", marginTop: 6 }}>{L[i]}</p></div>
                <Link href="/book?mode=class" className="btn btn-ghost btn-sm">Join</Link>
              </article>
            );
          })}
        </div>

        <SecHead id="pe-coaches" eyebrow="Coaches" title="Our coaches" style={{ marginTop: 64 }} />
        <div className="g3">
          {["Coach Lorem", "Coach Ipsum", "Coach Dolor"].map((n, i) => (
            <div className="person" key={n}>
              <Ph kind="coach" tone={(["dark", "dark2", "lav"] as Tone[])[i]} label={n} />
              <h3>{n}</h3>
              <p className="muted" style={{ fontSize: ".9rem" }}>{["Tennis · 10 yrs", "Pickleball · 6 yrs", "Tennis & Pickleball · 8 yrs"][i]}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
