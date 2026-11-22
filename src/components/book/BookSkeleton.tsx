/* Book page loading skeletons (spec §6, v6.04): the page's text (title, lead, tabs) shows at once; each tab's data streams in after it,
   with these shimmering placeholders in its place until it arrives. Server-safe (no client code), shared with the client-side
   first-click fetch of the Class / event tab. Uses the admin skeleton bars (.skel, v6.01). */
const Bar = ({ w = "100%", h }: { w?: string | number; h?: string | number }) => <span className="skel" style={{ width: w, height: h }} />;
const Busy = ({ what }: { what: string }) => <span className="sr-only">Loading {what}…</span>;

function SummarySkel({ title, rows }: { title: string; rows: number }) {
  return (
    <aside className="summary">
      <h4>{title}</h4>
      {Array.from({ length: rows }, (_, i) => <div key={i} className="row" style={{ justifyContent: "space-between", gap: 12 }}><Bar w="35%" /><Bar w="30%" /></div>)}
      <Bar w="80%" h=".7em" />
    </aside>
  );
}

/** Court booking: stepper labels, the court picker (cards with art boxes) and the summary */
export function CourtSkel({ heading = true }: { heading?: boolean }) {
  return (
    <div className="skel-wrap" role="status" aria-busy="true"><Busy what="courts" />
      <div className="stepper" aria-hidden="true">
        {["Court", "Date", "Time", "Details"].map((t, i) => (
          <button key={t} type="button" disabled tabIndex={-1} className={i === 0 ? "on" : ""}><b>{i + 1}. {t}</b><Bar w="55%" h=".75em" /></button>
        ))}
      </div>
      <div className="book-grid">
        <div className="panel">
          {heading ? <h2 style={{ fontSize: "1.3rem" }}>Choose a court</h2> : <Bar w="40%" h="1.3rem" />}
          <div className="pick-courts">
            {[0, 1, 2].map((i) => (
              <div key={i} className="pick skel-card">
                <span className="skel skel-art" />
                <span className="b"><Bar w="60%" h="1em" /><Bar w="90%" h=".75em" /></span>
              </div>
            ))}
          </div>
        </div>
        <SummarySkel title="Booking summary" rows={4} />
      </div>
    </div>
  );
}

/** Class / event: the class list (date block + title + fee) and the summary */
export function ClassSkel() {
  return (
    <div className="book-grid skel-wrap" role="status" aria-busy="true"><Busy what="classes" />
      <div className="panel">
        <h2 style={{ fontSize: "1.3rem" }}>Choose a class</h2>
        <div className="cls-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="cls-card skel-card">
              <span className="skel skel-date" />
              <span><Bar w="55%" h="1em" /><Bar w="75%" h=".75em" /></span>
              <span style={{ display: "grid", justifyItems: "end" }}><Bar w={64} h="1em" /><Bar w={90} h=".7em" /></span>
            </div>
          ))}
        </div>
      </div>
      <SummarySkel title="Registration summary" rows={3} />
    </div>
  );
}
