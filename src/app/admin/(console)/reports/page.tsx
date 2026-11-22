import { Fragment } from "react";
import Link from "next/link";
import BarChart from "@/components/admin/BarChart";
import { CountUp, DigitRoll } from "@/components/admin/KpiValue";
import ReportFilters from "@/components/admin/ReportFilters";
import { listAllBookingsInRange, type BookingRow } from "@/lib/adminData";
import { requireAdmin } from "@/lib/auth";
import { getClosures } from "@/lib/availability";
import { getCourts } from "@/lib/catalog";
import { metrics } from "../../../../../supabase/functions/_shared/report"; // shared with the monthly-report email
import { HOURS } from "@/lib/config";
import { Pill } from "@/components/ui";
import { peso } from "@/lib/format";
import { addDaysKey, dayDiff, fmtDate, fmtDateLong, fmtH, fmtRange, tidyRange, todayKey } from "@/lib/time";
import type { Court } from "@/lib/types";

/* Reports (super-admins, spec §19). Bookings count by play date; revenue includes court fees and equipment. */
const RANGES: Record<string, string> = { l7: "Last 7 days", l30: "Last 30 days", mtd: "Month to date", n14: "Next 14 days" };
const MAX_CUSTOM_DAYS = 366; // the chart draws one bar per day
function rangeOf(k: string): [string, string] {
  const t = todayKey();
  if (k === "l7") return [addDaysKey(t, -6), t];
  if (k === "mtd") return [t.slice(0, 8) + "01", t];
  if (k === "n14") return [t, addDaysKey(t, 13)];
  return [addDaysKey(t, -29), t];
}
const pct = (v: number) => (v * 100).toFixed(1) + "%";

export default async function Reports({ searchParams }: { searchParams: Promise<{ r?: string; c?: string; from?: string; to?: string }> }) {
  await requireAdmin({ superOnly: true });
  const sp = await searchParams;
  const custom = sp.r === "custom" ? tidyRange(sp.from, sp.to, MAX_CUSTOM_DAYS) : null; // missing or impossible dates fall back to the default range
  const rk = custom ? "custom" : sp.r && sp.r in RANGES ? sp.r : "l30";
  const [from, to] = custom ? [custom.from, custom.to] : rangeOf(rk);
  const len = dayDiff(from, to) + 1;
  const pFrom = addDaysKey(from, -len), pTo = addDaysKey(from, -1);
  const [courts, closures, all] = await Promise.all([getCourts(), getClosures(), listAllBookingsInRange(pFrom, to)]);
  const cid = courts.some((c) => c.id === sp.c) ? sp.c! : "all";
  const cur = metrics(all, closures, from, to, cid, courts.length), prev = metrics(all, closures, pFrom, pTo, cid, courts.length);
  // money and percentages count up (countUp); the bookings count rolls like an odometer (digitRoll)
  const kpi = (label: string, v: number, p: number, kind: "peso" | "pct" | "count", goodUp = true) => {
    const d = p ? (v - p) / p : 0, up = v >= p;
    return (
      <div className="kpi" key={label}>
        <small>{label}</small><b>{kind === "count" ? <DigitRoll value={v} /> : <CountUp value={kind === "peso" ? Math.round(v) : v} kind={kind} />}</b>
        <span className="delta">{p || v ? <span className={up === goodUp ? "good" : "bad"}>{up ? "▲" : "▼"} {p ? pct(Math.abs(d)) : "new"}</span> : "—"} vs previous {len === 1 ? "day" : `${len} days`}</span>
      </div>
    );
  };
  // net revenue by day
  const daysList = Array.from({ length: len }, (_, i) => addDaysKey(from, i));
  const byDay = daysList.map((d) => metrics(all, closures, d, d, cid, courts.length));
  const maxNet = Math.max(1, ...byDay.map((m) => m.net));
  const cname = (id: string) => courts.find((c) => c.id === id)?.name ?? id;
  // what a clicked bar opens: the day's figures, then every booking that day (earliest first), each linking to its page
  const dayDetail = (day: string, m: ReturnType<typeof metrics<BookingRow>>) => {
    const list = [...m.L].sort((a, b) => a.hours[0] - b.hours[0] || a.court_id.localeCompare(b.court_id));
    return (
      <Fragment key={day}>
        <dl className="bar-stats">
          <div><dt>Net revenue</dt><dd>{peso(m.net)}</dd></div>
          <div><dt>Total revenue</dt><dd>{peso(m.gross)}</dd></div>
          <div><dt>Refunds</dt><dd>{peso(m.refunds)}</dd></div>
          <div><dt>Bookings</dt><dd>{m.bookings}</dd></div>
          <div><dt>Court-hours used</dt><dd>{m.occ} of {m.avail}</dd></div>
          <div><dt>Utilization</dt><dd>{pct(m.util)}</dd></div>
        </dl>
        {list.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Ref</th><th>Court</th><th>Time</th><th>Customer</th><th className="num">Total</th><th>Status</th></tr></thead>
              <tbody>{list.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/admin/bookings/view/${b.id}`}><b>{b.ref}</b></Link></td>
                  <td>{cname(b.court_id)}</td><td style={{ whiteSpace: "nowrap" }}>{fmtRange(b.hours)}</td>
                  <td>{b.name}<br /><small className="muted">{b.email}</small></td>
                  <td className="num">{peso(b.total)}{b.refund_pct ? <><br /><small className="muted">{b.refund_pct}% refunded</small></> : null}</td>
                  <td><Pill s={b.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="muted bar-empty" style={{ fontSize: ".86rem" }}>No bookings on this day.</p>}
      </Fragment>
    );
  };
  const perCourt = (c: Court) => metrics(all, closures, from, to, c.id, courts.length);
  const hours = HOURS.map((h) => {
    const occ = cur.appr.filter((b) => b.hours.includes(h)).length;
    const av = len * (cid === "all" ? courts.length : 1);
    return { h, v: av ? occ / av : 0 };
  });
  const peak = hours.reduce((a, b) => (b.v > a.v ? b : a), hours[0]);
  return (
    <ReportFilters ranges={Object.entries(RANGES).map(([k, label]) => ({ k, label }))} courts={[{ id: "all", name: "All courts" }, ...courts.map((c) => ({ id: c.id, name: c.name }))]} range={rk} court={cid} from={from} to={to}>
      {custom?.capped ? <div className="banner">A custom range can cover up to {MAX_CUSTOM_DAYS} days, so the end date was moved to {fmtDate(to)}.</div> : null}
      <p className="muted" style={{ fontSize: ".86rem" }}>{fmtDate(from)} – {fmtDate(to)} · by play date · {cur.avail} available court-hours (closures subtracted)</p>
      <div className="kpis">
        {kpi("Total Revenue", cur.gross, prev.gross, "peso")}
        {kpi("Net Revenue", cur.net, prev.net, "peso")}
        {kpi("Total Bookings", cur.bookings, prev.bookings, "count")}
        {kpi("Court Utilization", cur.util, prev.util, "pct")}
        {kpi("Cancellation Rate", cur.cancelRate, prev.cancelRate, "pct", false)}
        {kpi("Average Booking Value", cur.abv, prev.abv, "peso")}
        {kpi("Revenue / Available Court-Hour", cur.revpach, prev.revpach, "peso")}
        {kpi("Revenue / Occupied Court-Hour", cur.revpoch, prev.revpoch, "peso")}
      </div>
      <div className="chart-card">
        <h3>Net revenue by day</h3>
        <BarChart label="Net revenue by day" bars={byDay.map((m, i) => ({
          key: daysList[i],
          pct: Math.round((Math.max(0, m.net) / maxNet) * 950) / 10, // tallest bar is 95% of the chart height
          tip: `${fmtDate(daysList[i])}: net ${peso(m.net)}, total ${peso(m.gross)}, refunds ${peso(m.refunds)}, ${m.bookings} bookings, ${m.occ} court-hours`,
          title: fmtDateLong(daysList[i]),
          detail: dayDetail(daysList[i], m),
        }))} axis={
          /* date labels sit under the bars as text so they keep a fixed text size however wide the chart is drawn; the end labels are pinned inside the edges */
          <div className="chart-x" aria-hidden="true" key="axis">
            {daysList.map((d, i) => (len <= 14 || i % Math.ceil(len / 10) === 0 ? (
              <span key={d} style={{ left: `${((i + 0.5) / len) * 100}%` }} className={i === 0 ? "first" : i === len - 1 ? "last" : undefined}>{d.slice(5).replace("-", "/")}</span>
            ) : null))}
          </div>
        } />
      </div>
      <div className="g2" style={{ alignItems: "start" }}>
        <div className="chart-card">
          <h3>Utilization by court</h3>
          <div className="hbars">{courts.map((c) => { const m = perCourt(c); return <div className="hrow" key={c.id}><span>{c.name}</span><div className="track"><div className="fill" style={{ width: pct(m.util) }} /></div><span className="hv">{pct(m.util)}</span></div>; })}</div>
        </div>
        <div className="chart-card">
          <h3>Busiest hours</h3>
          <p className="muted" style={{ fontSize: ".84rem" }}>{peak.v ? `Peak: ${fmtH(peak.h)} (${pct(peak.v)})` : "No confirmed bookings in this range."}</p>
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
    </ReportFilters>
  );
}
