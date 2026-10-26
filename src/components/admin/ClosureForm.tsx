"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { closureAction } from "@/app/actions/admin";
import { CLOSE_HOUR, CLOSURE_CATEGORIES, HOURS } from "@/lib/config";
import { fmtH } from "@/lib/time";

const WD: [number, string][] = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];
function Submit() { const { pending } = useFormStatus(); return <button className="btn btn-danger" type="submit" disabled={pending}>{pending ? "Closing…" : "Close courts"}</button>; }

/* New closure (spec §7 Closures): courts, dates (single, range or weekly), whole day or hours, reason */
export default function ClosureForm({ courts, today }: { courts: { id: string; name: string }[]; today: string }) {
  const [repeat, setRepeat] = useState<"none" | "weekly">("none");
  const [mode, setMode] = useState<"day" | "hours">("day");
  const [noEnd, setNoEnd] = useState(false);
  return (
    <form action={closureAction} className="stack">
      <fieldset className="ex-fs stack"><legend>Courts</legend>
        <div className="seg">{courts.map((c) => <label key={c.id}><input type="checkbox" name="courts" value={c.id} defaultChecked /> {c.name}</label>)}</div>
      </fieldset>
      <fieldset className="ex-fs stack"><legend>Repeat</legend>
        <div className="seg">
          <label><input type="radio" name="repeat" value="none" checked={repeat === "none"} onChange={() => setRepeat("none")} /> Doesn&apos;t repeat</label>
          <label><input type="radio" name="repeat" value="weekly" checked={repeat === "weekly"} onChange={() => setRepeat("weekly")} /> Weekly, on chosen days</label>
        </div>
        {repeat === "weekly" ? <div className="seg">{WD.map(([d, n]) => <label key={d}><input type="checkbox" name="days" value={d} /> {n}</label>)}</div> : null}
      </fieldset>
      <div className="form-grid">
        <label className="f"><span>{repeat === "weekly" ? "Starts" : "From"}</span><input className="inp" type="date" name="from" min={today} defaultValue={today} required /></label>
        <label className="f"><span>{repeat === "weekly" ? "Ends" : "To (same day for one date)"}</span><input className="inp" type="date" name="to" min={today} disabled={repeat === "weekly" && noEnd} /></label>
        {repeat === "weekly" ? <label className="check full"><input type="checkbox" name="noEnd" checked={noEnd} onChange={(e) => setNoEnd(e.target.checked)} /><span>No end date (repeats every week until you reopen it)</span></label> : null}
      </div>
      <fieldset className="ex-fs stack"><legend>Hours</legend>
        <div className="seg">
          <label><input type="radio" name="mode" value="day" checked={mode === "day"} onChange={() => setMode("day")} /> Whole day (7:00 AM – 10:00 PM)</label>
          <label><input type="radio" name="mode" value="hours" checked={mode === "hours"} onChange={() => setMode("hours")} /> Specific hours</label>
        </div>
        {mode === "hours" ? (
          <div className="form-grid">
            <label className="f"><span>From time</span><select className="inp" name="start">{HOURS.map((h) => <option key={h} value={h}>{fmtH(h)}</option>)}</select></label>
            <label className="f"><span>To time</span><select className="inp" name="end" defaultValue={String(HOURS[0] + 2)}>{HOURS.map((h) => h + 1).map((h) => <option key={h} value={h}>{h === CLOSE_HOUR ? "10:00 PM (closing)" : fmtH(h)}</option>)}</select></label>
          </div>
        ) : null}
      </fieldset>
      <div className="form-grid">
        <label className="f"><span>Reason</span><select className="inp" name="category">{CLOSURE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="f"><span>Note (optional, shown to customers)</span><input className="inp" name="note" placeholder="e.g. Court resurfacing" /></label>
      </div>
      <p className="muted" style={{ fontSize: ".86rem" }}>Bookings already on those hours are cancelled with a 100% refund for anyone who paid, and each customer is emailed with a &quot;Book another time&quot; link. Waitlist entries on those hours are removed and notified.</p>
      <div className="row"><Submit /><button className="btn btn-ghost" type="button" data-close="1">Back</button></div>
    </form>
  );
}
