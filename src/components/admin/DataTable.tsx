"use client";
import { useState, type ReactNode } from "react";

export type Row = { key: string; search: string; cells: ReactNode[] };

/* Tables (spec §7, v4.44): search bar, first 10 rows + "View 10 more", scrolls with sticky headings */
export default function DataTable({ head, rows, num = [], empty = "Nothing here right now.", noSearch }: { head: string[]; rows: Row[]; num?: number[]; empty?: string; noSearch?: boolean }) {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(10);
  if (!rows.length) return <div className="empty">{empty}</div>;
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = terms.length ? rows.filter((r) => terms.every((t) => r.search.toLowerCase().includes(t))) : rows;
  const vis = hits.slice(0, shown);
  return (
    <div className="tbl-block">
      {!noSearch && rows.length > 5 ? (
        <div className="tbl-tools">
          <input className="inp tbl-q" type="search" placeholder="Search name, email, reference, court, date…" aria-label="Search this table" value={q} onChange={(e) => { setQ(e.target.value); setShown(10); }} />
          <span className="tbl-count">{terms.length ? `${hits.length} of ${rows.length}` : `${rows.length} rows`}</span>
        </div>
      ) : null}
      <div className="tbl-wrap tbl-scroll">
        <table className="tbl">
          <thead><tr>{head.map((h, i) => <th key={h + i} className={num.includes(i) ? "num" : undefined}>{h}</th>)}</tr></thead>
          <tbody>
            {vis.map((r) => <tr key={r.key}>{r.cells.map((c, i) => <td key={i} className={num.includes(i) ? "num" : undefined}>{c}</td>)}</tr>)}
            {!vis.length ? <tr><td colSpan={head.length} className="muted">No matches.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {hits.length > shown ? (
        <div className="tbl-more"><button className="btn btn-ghost btn-sm" onClick={() => setShown(shown + 10)}>View 10 more</button><span className="tbl-count">Showing {shown} of {hits.length}</span></div>
      ) : null}
    </div>
  );
}
