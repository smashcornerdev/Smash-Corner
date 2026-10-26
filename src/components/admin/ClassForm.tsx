"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { openClassAction } from "@/app/actions/admin";
import { CLOSE_HOUR, HOURS } from "@/lib/config";
import { addDaysKey, fmtDate, fmtH } from "@/lib/time";

type Rental = { name: string; fee: number; qty: number };
function Submit() { const { pending } = useFormStatus(); return <button className="btn btn-lime" type="submit" disabled={pending}>{pending ? "Opening…" : "Open registration"}</button>; }
const pad = (n: number) => String(n).padStart(2, "0");

/* Open registration (spec §7 Classes & Events; mockup "Open registration" modal) */
export default function ClassForm({ courts, rentals, today }: { courts: { id: string; name: string; type: string }[]; rentals: Record<string, Rental>; today: string }) {
  const [courtId, setCourtId] = useState(courts.find((c) => c.type === "pickle")?.id ?? courts[0]?.id);
  const [date, setDate] = useState(addDaysKey(today, 7));
  const [dlDate, setDlDate] = useState(addDaysKey(today, 6));
  const [dlHour, setDlHour] = useState(18);
  const [rent, setRent] = useState(true);
  const r = rentals[courts.find((c) => c.id === courtId)?.type ?? ""] ?? { name: "Equipment", fee: 0, qty: 0 };
  const item = r.name.toLowerCase();
  // the deadline can be any day from today up to the class date
  const dlDays: string[] = [];
  if (date >= today) for (let d = today; d <= date; d = addDaysKey(d, 1)) dlDays.push(d);
  const dl = dlDays.includes(dlDate) ? dlDate : dlDays[Math.max(0, dlDays.length - 2)] ?? "";
  return (
    <form action={openClassAction} className="stack">
      <div className="form-grid">
        <label className="f full"><span>Title</span><input className="inp" name="title" required minLength={3} maxLength={80} placeholder="e.g. Pickleball 101: Beginners Clinic" autoFocus /></label>
        <label className="f full"><span>Court</span>
          <select className="inp" name="courtId" value={courtId} onChange={(e) => setCourtId(e.target.value)}>{courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label className="f full"><span>Date</span><input className="inp" type="date" name="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required /></label>
        <label className="f"><span>Start time</span><select className="inp" name="start" defaultValue="8">{HOURS.map((h) => <option key={h} value={h}>{fmtH(h)}</option>)}</select></label>
        <label className="f"><span>End time</span><select className="inp" name="end" defaultValue="10">{HOURS.map((h) => h + 1).map((h) => <option key={h} value={h}>{h === CLOSE_HOUR ? "10:00 PM (closing)" : fmtH(h)}</option>)}</select></label>
        <label className="f"><span>Registration deadline (date)</span>
          <select className="inp" value={dl} onChange={(e) => setDlDate(e.target.value)} disabled={!dlDays.length}>{dlDays.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}</select>
        </label>
        <label className="f"><span>Registration deadline (time)</span>
          <select className="inp" value={dlHour} onChange={(e) => setDlHour(Number(e.target.value))}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{fmtH(h)}</option>)}</select>
        </label>
        <input type="hidden" name="deadline" value={dl ? `${dl}T${pad(dlHour)}:00` : ""} />
        <label className="f"><span>Capacity (participants)</span><input className="inp" type="number" name="capacity" min={1} defaultValue={12} required /></label>
        <label className="f"><span>Fee per participant (₱)</span><input className="inp" type="number" name="fee" min={0} step={50} defaultValue={500} required /></label>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack"><legend style={{ fontWeight: 600, marginBottom: 10 }}>Rentals</legend>
        <div className="seg">
          <label><input type="radio" name="rentals" value="yes" checked={rent} onChange={() => setRent(true)} /> Offer {item} rental</label>
          <label><input type="radio" name="rentals" value="no" checked={!rent} onChange={() => setRent(false)} /> No rentals</label>
        </div>
        {rent ? (
          <div className="form-grid" key={courtId}>
            <label className="f"><span>Rental fee per {item}, whole class (₱)</span><input className="inp" type="number" name="rentalFee" min={0} defaultValue={r.fee} /></label>
            <label className="f"><span>How many to rent out</span><input className="inp" type="number" name="rentalQty" min={1} defaultValue={Math.max(1, r.qty)} /></label>
          </div>
        ) : null}
      </fieldset>
      <p className="muted" style={{ fontSize: ".86rem" }}>Tennis courts rent rackets; pickleball courts rent paddles. The court is blocked for court bookings during the class. It can&apos;t clash with a closure, another class, or existing court bookings.</p>
      <div className="row"><Submit /><button className="btn btn-ghost" type="button" data-close="1">Cancel</button></div>
    </form>
  );
}
