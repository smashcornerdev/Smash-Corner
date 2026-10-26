import Link from "next/link";
import { listBookings, type BookingRow } from "@/lib/adminData";
import { requireAdmin } from "@/lib/auth";
import { getClosures } from "@/lib/availability";
import { getCourts } from "@/lib/catalog";
import { closedHoursIn } from "@/lib/closures";
import { HOURS } from "@/lib/config";
import { peso } from "@/lib/format";
import { addDaysKey, dayDiff, fmtDate, fmtH, todayKey } from "@/lib/time";
import type { Closure, Court } from "@/lib/types";

/* Reports (super-admins, spec §19). Bookings count by play date; revenue includes court fees and equipment. */
const RANGES: Record<string, string> = { l7: "Last 7 days", l30: "Last 30 days", mtd: "Month to date", n14: "Next 14 days" };
function rangeOf(k: string): [string, string] {
  const t = todayKey();
  if (k === "l7") return [addDaysKey(t, -6), t];
  if (k === "mtd") return [t.slice(0, 8) + "01", t];
  if (k === "n14") return [t, addDaysKey(t, 13)];
  return [addDaysKey(t, -29), t];
}
function metrics(all: BookingRow[], closures: Closure[], from: string, to: string, cid: string, nCourts: number) {
  const L = all.filter((b) => b.date >= from && b.date <= to && (cid === "all" || b.court_id === cid));
  const appr = L.filter((b) => b.status === "approved"), canc = L.filter((b) => b.status === "cancelled" && b.refund_pct != null);
  const pend = L.filter((b) => ["pending", "awaiting", "verify"].includes(b.status));
  const paid = appr.length + canc.length;
  const gross = [...appr, ...canc].reduce((x, b) => x + b.total, 0);
  const refunds = canc.reduce((x, b) => x + Math.round((b.total * (b.refund_pct ?? 0)) / 100), 0);
  const net = gross - refunds;
  const days = dayDiff(from, to) + 1;
  const avail = Math.max(0, days * HOURS.length * (cid === "all" ? nCourts : 1) - closedHoursIn(closures, from, to, cid));
  const occ = appr.reduce((x, b) => x + b.hours.length, 0);
  return { L, appr, gross, net, refunds, bookings: paid + pend.length, cancelled: canc.length, util: avail ? occ / avail : 0, cancelRate: paid ? canc.length / paid : 0, abv: paid ? gross / paid : 0, revpach: avail ? net / avail : 0, revpoch: occ ? net / occ : 0, occ, avail };
}
const pct = (v: number) => (v * 100).toFixed(1) + "%";

export default async function Reports({ searchParams }: { searchParams: Promise<{ r?: string; c?: string }> }) {
  await requireAdmin({ superOnly: true });
  const sp = await searchParams;
  const rk = sp.r && sp.r in RANGES ? sp.r : "l30";
  const [from, to] = rangeOf(rk);
  const len = dayDiff(from, to) + 1;
  const pFrom = addDaysKey(from, -len), pTo = addDaysKey(from, -1);
  const [courts, closures, all] = await Promise.all([getCourts(), getClosures(), listBookings({ from: pFrom, to })]);
  const cid = courts.some((c) => c.id === sp.c) ? sp.c! : "all";
  const cur = metrics(all, closures, from, to, cid, courts.length), prev = metrics(all, closures, pFrom, pTo, cid, courts.length);
  const kpi = (label: string, v: number, p: number, fmt: (n: number) => string, goodUp = true) => {
    const d = p ? (v - p) / p : 0, up = v >= p;
    return (
      <div className="kpi" key={label}>
        <small>{label}</small><b>{fmt(v)}</b>
        <span className="delta">{p || v ? <span className={up === goodUp ? "good" : "bad"}>{up ? "▲" : "▼"} {p ? pct(Math.abs(d)) : "new"}</span> : "—"} vs previous {len} days</span>
      </div>
    );
  };
  // net revenue by day
  const daysList = Array.from({ length: len }, (_, i) => addDaysKey(from, i));
  const byDay = daysList.map((d) => metrics(all, closures, d, d, cid, courts.length));
  const maxNet = Math.max(1, ...byDay.map((m) => m.net));
  const W = 640, H = 200, bw = W / len;
  const perCourt = (c: Court) => metrics(all, closures, from, to, c.id, courts.length);
  const hours = HOURS.map((h) => {
    const occ = cur.appr.filter((b) => b.hours.includes(h)).length;
    const av = len * (cid === "all" ? courts.length : 1);
    return { h, v: av ? occ / av : 0 };
  });
  const peak = hours.reduce((a, b) => (b.v > a.v ? b : a), hours[0]);
  const q = (o: Record<string, string>) => "?" + new URLSearchParams({ r: rk, c: cid, ...o }).toString();
  return (
    <>
      <div className="rep-filters">
        <div className="chips">{Object.entries(RANGES).map(([k, l]) => <Link key={k} className={"chip" + (k === rk ? " on" : "")} href={q({ r: k })}>{l}</Link>)}</div>
        <div className="chips">{[{ id: "all", name: "All courts" }, ...courts].map((c) => <Link key={c.id} className={"chip" + (c.id === cid ? " on" : "")} href={q({ c: c.id })}>{c.name}</Link>)}</div>
      </div>
      <p className="muted" style={{ fontSize: ".86rem" }}>{fmtDate(from)} – {fmtDate(to)} · by play date · {cur.avail} available court-hours (closures subtracted)</p>
      <div className="kpis">
        {kpi("Total Revenue", cur.gross, prev.gross, peso)}
        {kpi("Net Revenue", cur.net, prev.net, peso)}
        {kpi("Total Bookings", cur.bookings, prev.bookings, String)}
        {kpi("Court Utilization", cur.util, prev.util, pct)}
        {kpi("Cancellation Rate", cur.cancelRate, prev.cancelRate, pct, false)}
        {kpi("Average Booking Value", cur.abv, prev.abv, (n) => peso(Math.round(n)))}
        {kpi("Revenue / Available Court-Hour", cur.revpach, prev.revpach, (n) => peso(Math.round(n)))}
        {kpi("Revenue / Occupied Court-Hour", cur.revpoch, prev.revpoch, (n) => peso(Math.round(n)))}
      </div>
      <div className="chart-card">
        <h3>Net revenue by day</h3>
        <div className="chart-scroll">
          <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="Net revenue by day">
            <line className="grid base" x1={0} x2={W} y1={H} y2={H} />
            {byDay.map((m, i) => {
              const h = (m.net / maxNet) * (H - 10);
              return (
                <g className="col" key={daysList[i]}>
                  <title>{`${fmtDate(daysList[i])}: net ${peso(m.net)}, total ${peso(m.gross)}, refunds ${peso(m.refunds)}, ${m.bookings} bookings, ${m.occ} court-hours`}</title>
                  <rect className="bar" x={i * bw + bw * 0.15} width={bw * 0.7} y={H - h} height={h} />
                  {len <= 14 || i % Math.ceil(len / 10) === 0 ? <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle">{daysList[i].slice(5).replace("-", "/")}</text> : null}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="g2" style={{ alignItems: "start" }}>
        <div className="chart-card">
          <h3>Utilization by court</h3>
          <div className="hbars">{courts.map((c) => { const m = perCourt(c); return <div className="hrow" key={c.id}><span>{c.name}</span><div className="track"><div className="fill" style={{ width: pct(m.util) }} /></div><span className="hv">{pct(m.util)}</span></div>; })}</div>
        </div>
        <div className="chart-card">
          <h3>Busiest hours</h3>
          <p className="muted" style={{ fontSize: ".84rem" }}>Peak: {fmtH(peak.h)} ({pct(peak.v)})</p>
          <div className="hbars">{hours.map((x) => <div className="hrow" key={x.h}><span>{fmtH(x.h)}</span><div className="track"><div className="fill" style={{ width: pct(x.v) }} /></div><span className="hv">{pct(x.v)}</span></div>)}</div>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Court</th><th className="num">Total</th><th className="num">Net</th><th className="num">Bookings</th><th className="num">Utilization</th><th className="num">Cancel rate</th><th className="num">Avg value</th></tr></thead>
          <tbody>
            {courts.map((c) => { const m = perCourt(c); return <tr key={c.id}><td>{c.name}</td><td className="num">{peso(m.gross)}</td><td className="num">{peso(m.net)}</td><td className="num">{m.bookings}</td><td className="num">{pct(m.util)}</td><td className="num">{pct(m.cancelRate)}</td><td className="num">{peso(Math.round(m.abv))}</td></tr>; })}
            {(() => { const m = metrics(all, closures, from, to, "all", courts.length); return <tr className="tot"><td>All courts</td><td className="num">{peso(m.gross)}</td><td className="num">{peso(m.net)}</td><td className="num">{m.bookings}</td><td className="num">{pct(m.util)}</td><td className="num">{pct(m.cancelRate)}</td><td className="num">{peso(Math.round(m.abv))}</td></tr>; })()}
          </tbody>
        </table>
      </div>
    </>
  );
}
