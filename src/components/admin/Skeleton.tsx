/* Loading skeletons for admin tab data (spec §7, v6.01): shown while a tab's data loads, after its title, tabs and note are already
   on screen. Grey bars with a soft shimmer (still with reduced motion). Server-safe (no client code). */
import { CAL_NOTE, CalLegend } from "@/components/admin/CalParts";
import { HOURS } from "@/lib/config";

const Bar = ({ w = "100%", h }: { w?: string | number; h?: string | number }) => <span className="skel" style={{ width: w, height: h }} />;
const Busy = () => <span className="sr-only">Loading…</span>;

/** a table: optional search row, header and `rows` rows of `cols` columns */
export function SkelTable({ cols = 5, rows = 5, search = true }: { cols?: number; rows?: number; search?: boolean }) {
  const ws = ["70%", "85%", "60%", "75%", "50%", "65%", "80%", "55%"];
  return (
    <div className="tbl-block skel-wrap" role="status" aria-busy="true"><Busy />
      {search ? <div className="tbl-tools"><Bar w="min(380px,60%)" h={38} /><Bar w={70} /></div> : null}
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr>{Array.from({ length: cols }, (_, i) => <th key={i}><Bar w="55%" /></th>)}</tr></thead>
        <tbody>{Array.from({ length: rows }, (_, r) => <tr key={r}>{Array.from({ length: cols }, (_, c) => <td key={c}><Bar w={ws[(r + c) % ws.length]} />{c < 2 ? <Bar w="45%" h=".7em" /> : null}</td>)}</tr>)}</tbody>
      </table></div>
    </div>
  );
}

/** payment method cards */
export function SkelCards({ n = 3 }: { n?: number }) {
  return (
    <div className="pm-list skel-wrap" role="status" aria-busy="true"><Busy />
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="pm-card skel-card"><Bar w={20} h={20} /><Bar w={96} h={96} />
          <div className="stack" style={{ gap: 8 }}><Bar w="40%" h="1.1em" /><Bar w="80%" /><Bar w="65%" /></div>
          <div className="row" style={{ gap: 8 }}><Bar w={56} h={34} /><Bar w={56} h={34} /><Bar w={64} h={34} /></div>
        </div>
      ))}
    </div>
  );
}

/** the Reports data (spec §19): date line, 8 KPI cards, the daily chart, the two bar lists and the per-court table */
export function SkelReports({ courts }: { courts: number }) {
  const bars = [35, 60, 45, 80, 30, 55, 90, 40, 70, 50, 85, 35, 65, 45, 75, 55, 30, 60, 95, 40, 50, 70, 35, 80];
  const list = (n: number) => <div className="hbars">{Array.from({ length: n }, (_, i) => <div className="hrow" key={i}><Bar w="70%" /><Bar h={10} /><Bar /></div>)}</div>;
  return (
    <div className="tab-data rep-skel">
      <Bar w="min(420px,80%)" h=".86rem" />
      <div className="kpis">
        {Array.from({ length: 8 }, (_, i) => <div className="kpi" key={i}><Bar w="60%" h=".74rem" /><Bar w="70%" h="2rem" /><Bar w="85%" h=".76rem" /></div>)}
      </div>
      <div className="chart-card">
        <Bar w={180} h="1.2em" />
        <div className="rep-skel-chart">{bars.map((h, i) => <Bar key={i} h={`${h}%`} />)}</div>
      </div>
      <div className="g2" style={{ alignItems: "start" }}>
        <div className="chart-card"><Bar w={170} h="1.2em" />{list(courts)}</div>
        <div className="chart-card"><Bar w={130} h="1.2em" /><Bar w={190} h=".84rem" />{list(HOURS.length)}</div>
      </div>
      <SkelTable cols={7} rows={courts + 1} search={false} />
    </div>
  );
}

/** a button-sized bar (e.g. + Close courts while its form's data loads) */
export const SkelBtn = ({ w = 170 }: { w?: number }) => <span className="skel skel-btn" style={{ width: w }} role="status" aria-busy="true"><Busy /></span>;

/** a banner line */
export const SkelBanner = () => <div className="banner skel-wrap" role="status" aria-busy="true"><Busy /><Bar w="60%" /></div>;

/** the whole Admin Calendar (spec §7, v6.08): court filter chips, the real legend, the toolbar (arrows, Today, title, views), a week
 *  grid (day headers, hour labels, a few booking blocks) and the real note under it. Shows at once when the Calendar tab is opened,
 *  while the calendar's code and courts load. */
export function SkelCalendar() {
  const HOURS = 15, DAYS = 7;
  // a few booking-shaped blocks: [day column 1–7, first hour row, hours long]
  const blocks: [number, number, number][] = [[1, 2, 2], [2, 6, 1], [3, 1, 3], [4, 9, 2], [5, 4, 1], [5, 11, 2], [6, 7, 3], [7, 3, 2]];
  return (
    <div className="stack cal-skel" role="status" aria-busy="true"><span className="sr-only">Loading calendar…</span>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="chips" aria-hidden="true">{[84, 76, 104, 104].map((w, i) => <span key={i} className="skel skel-chip" style={{ width: w }} />)}</div>
        <CalLegend />
      </div>
      <div className="fc-wrap" aria-hidden="true">
        <div className="cs-bar">
          <div className="cs-grp"><Bar w={36} h={32} /><Bar w={36} h={32} /><Bar w={62} h={32} /></div>
          <Bar w={150} h="1.2em" />
          <div className="cs-grp"><Bar w={58} h={32} /><Bar w={54} h={32} /><Bar w={44} h={32} /><Bar w={44} h={32} /></div>
        </div>
        <div className="cs-scroll">
          <div className="cs-grid">
            <span className="cs-h" style={{ gridColumn: 1, gridRow: 1 }} />
            {Array.from({ length: DAYS }, (_, d) => <span key={d} className="cs-h" style={{ gridColumn: d + 2, gridRow: 1 }}><Bar w="60%" h=".8em" /></span>)}
            {Array.from({ length: HOURS }, (_, h) => (
              <span key={h} className="cs-t" style={{ gridColumn: 1, gridRow: h + 2 }}><Bar w={34} h=".7em" /></span>
            ))}
            {Array.from({ length: HOURS * DAYS }, (_, i) => <span key={i} className="cs-c" style={{ gridColumn: (i % DAYS) + 2, gridRow: Math.floor(i / DAYS) + 2 }} />)}
            {blocks.map(([d, h, n], i) => <span key={i} className="skel cs-ev" style={{ gridColumn: d + 1, gridRow: `${h + 1} / span ${n}` }} />)}
          </div>
        </div>
      </div>
      <p className="muted" style={{ fontSize: ".82rem" }}>{CAL_NOTE}</p>
    </div>
  );
}
