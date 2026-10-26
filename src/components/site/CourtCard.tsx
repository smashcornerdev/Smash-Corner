import Link from "next/link";
import { Ph, TONES, courtArt } from "@/components/art";
import { L } from "@/lib/config";
import { peso } from "@/lib/format";
import type { Court } from "@/lib/types";

/** court card: badge shape with lavender outline (spec §14) */
export function CourtCard({ c, i, specs }: { c: Court; i: number; specs?: boolean }) {
  return (
    <article className="badge court-card">
      <div className="in">
        <Ph kind={courtArt(c.type)} tone={TONES[i % 3]} label={`${c.name} photo`} />
        <div className="body">
          <h3>{c.name}</h3>
          {specs ? (
            <dl className="spec">
              <dt>Surface</dt><dd>{c.surface}</dd>
              <dt>Size</dt><dd>{c.size}</dd>
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
              <p className="muted" style={{ fontSize: ".9rem" }}>{L[i % L.length]}</p>
            </>
          )}
          <Link href={`/book?court=${c.id}`} className="btn btn-ghost btn-sm">Book this court</Link>
        </div>
      </div>
    </article>
  );
}
