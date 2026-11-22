/* Admin Calendar text shared by the calendar and its loading skeleton (spec §7, v6.08), so the text shows at once and doesn't
   change when the calendar arrives. No client code: usable from server and client components. */
export function CalLegend() {
  return (
    <div className="legend">
      <span><i style={{ background: "var(--c-t1)" }} />Tennis 1</span><span><i style={{ background: "var(--c-p1)" }} />Pickleball 1</span><span><i style={{ background: "var(--c-p2)" }} />Pickleball 2</span>
      <span><i style={{ border: "2px dashed var(--muted)", background: "transparent" }} />Not confirmed yet</span>
    </div>
  );
}

export const CAL_NOTE = "Day view shows one column per court. Click a booking to see its details; Open booking takes you to approve, edit or cancel it. Striped blocks are classes; red striped areas are closures. In Month view, click a day to open it.";
