import Link from "next/link";
import { CourtImg, TONES } from "@/components/art";
import { peso } from "@/lib/format";
import type { Court } from "@/lib/types";

/* short description per court type, shown on the Home court cards */
const BLURB: Record<Court["type"], string> = {
  tennis: "Regulation dimensions and a consistent bounce, suited to singles, doubles and coaching drills.",
  pickle: "Official dimensions on a cushioned surface that is easier on the knees. Ideal for doubles and open play.",
};

/** court card: badge shape with lavender outline (spec §14) */
export function CourtCard({ c, i, specs }: { c: Court; i: number; specs?: boolean }) {
  return (
    <article className="badge court-card">
      <div className="in">
        <CourtImg id={c.id} type={c.type} tone={TONES[i % 3]} label={`${c.name} layout`} />
        <div className="body">
          <h3>{c.name}</h3>
          {specs ? (
            <dl className="spec">
              <dt>Players</dt><dd>{c.min_players}–{c.max_players}</dd>
              <dt>Lights</dt><dd>Until 10:00 PM</dd>
              <dt>Rate</dt><dd className="lime">{peso(c.rate)} / hour</dd>
              <dt>Note</dt><dd>{c.note}</dd>
            </dl>
          ) : (
            <>
              <div className="meta"><span>{c.min_players}–{c.max_players} players · {c.surface}</span></div>
              <p className="muted" style={{ fontSize: ".86rem", margin: "2px 0 0" }}>{c.note}</p>
              <div className="price">{peso(c.rate)}<span className="muted" style={{ fontFamily: "var(--body)", fontSize: ".85rem" }}> / hour</span></div>
              <p className="muted" style={{ fontSize: ".9rem" }}>{BLURB[c.type]}</p>
            </>
          )}
          <Link href={`/book?court=${c.id}`} className="btn btn-ghost btn-sm">Book this court</Link>
        </div>
      </div>
    </article>
  );
}
