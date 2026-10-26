"use client";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Arrow, Ph, TONES, courtArt } from "@/components/art";
import { addToCartAction, joinWaitlistAction } from "@/app/actions/booking";
import { CLOSE_HOUR, HOURS } from "@/lib/config";
import { peso, validEmail, validPhone } from "@/lib/format";
import { daysInMonth, fmtDate, fmtDateLong, fmtH, fmtMonth, fmtRange, fmtTs, toRanges, weekday } from "@/lib/time";
import type { Court, EquipmentItem } from "@/lib/types";

type SlotState = "past" | "closed" | "class" | "taken" | "reserved" | "cart" | "open";
type Day = { date: string; open: number; closed: boolean; bookable: boolean };
export type Claim = { token: string; courtId: string; date: string; hour: number; name: string; email: string; phone: string; players: number; expires: string };

const LAST_KEY = "sc-last-details";
const loadLast = () => { try { return JSON.parse(localStorage.getItem(LAST_KEY) || "{}"); } catch { return {}; } };

/* Court booking: Court → Date → Time → Details & Equipment → cart (spec §6) */
export default function BookingFlow(props: { courts: Court[]; items: EquipmentItem[]; today: string; max: string; initCourt?: string; initDate?: string; claim?: Claim }) {
  const { courts, items, today, max, claim } = props;
  const router = useRouter();
  const [step, setStep] = useState(claim ? 4 : props.initCourt ? (props.initDate ? 3 : 2) : 1);
  const [courtId, setCourtId] = useState<string | null>(claim?.courtId ?? props.initCourt ?? null);
  const [date, setDate] = useState<string | null>(claim?.date ?? props.initDate ?? null);
  const [month, setMonth] = useState((claim?.date ?? props.initDate ?? today).slice(0, 7));
  const [slots, setSlots] = useState<number[]>(claim ? [claim.hour] : []);
  const [pStart, setPStart] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [hoverEnd, setHoverEnd] = useState<number | null>(null);
  const [days, setDays] = useState<Day[] | null>(null);
  const [states, setStates] = useState<Record<number, SlotState> | null>(null);
  const [free, setFree] = useState<Record<string, number>>({});
  const [rent, setRent] = useState<"yes" | "no" | null>(null);
  const [equip, setEquip] = useState<Record<string, number>>({});
  const [f, setF] = useState({ name: claim?.name ?? "", phone: claim?.phone ?? "", email: claim?.email ?? "", players: String(claim?.players ?? "") });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState("");
  const [wait, setWait] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const court = courts.find((c) => c.id === courtId) ?? null;
  const claimQ = claim ? `&claim=${encodeURIComponent(claim.token)}` : "";

  useEffect(() => {
    if (claim) return;
    const last = loadLast();
    setF((x) => ({ ...x, name: last.name ?? "", phone: last.phone ?? "", email: last.email ?? "" }));
  }, [claim]);

  const loadMonth = useCallback(async () => {
    if (!courtId) return;
    setDays(null);
    const r = await fetch(`/api/availability?court=${courtId}&month=${month}${claimQ}`, { cache: "no-store" });
    if (r.ok) setDays((await r.json()).days);
  }, [courtId, month, claimQ]);
  const loadDay = useCallback(async () => {
    if (!courtId || !date) return;
    setStates(null);
    const r = await fetch(`/api/availability?court=${courtId}&date=${date}${claimQ}`, { cache: "no-store" });
    if (r.ok) setStates((await r.json()).hours);
  }, [courtId, date, claimQ]);
  useEffect(() => { if (step === 2) loadMonth(); }, [step, loadMonth]);
  useEffect(() => { if (step === 3) loadDay(); }, [step, loadDay]);
  useEffect(() => {
    if (step !== 4 || !date || !slots.length) return;
    fetch(`/api/equipment?date=${date}&hours=${slots.join(",")}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setFree(d.free ?? {})).catch(() => {});
  }, [step, date, slots]);
  useEffect(() => { if (court && !f.players) setF((x) => ({ ...x, players: String(court.min_players) })); }, [court, f.players]);

  /* ---------- price ---------- */
  const eqForCourt = court ? items.filter((i) => i.type === court.type) : [];
  const eqUsed = rent === "yes" ? equip : {};
  const total = court && slots.length
    ? court.rate * slots.length + eqForCourt.reduce((a, it) => a + it.rate * (eqUsed[it.id] || 0) * slots.length, 0) : 0;

  const pickCourt = (id: string) => {
    if (id !== courtId) { setCourtId(id); setDate(null); setSlots([]); setEquip({}); setPStart(null); setAdding(false); setF((x) => ({ ...x, players: "" })); }
    setStep(2);
  };
  const pickDate = (k: string) => {
    if (k !== date) { setDate(k); setSlots([]); setPStart(null); setAdding(false); }
    setStep(3);
  };
  const can = (n: number) => n === 1 || (n === 2 && !!court) || (n === 3 && !!court && !!date) || (n === 4 && slots.length > 0);

  /* ---------- add to cart ---------- */
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!court || !date) return;
    const er: Record<string, string> = {};
    const pl = parseInt(f.players, 10);
    if (!f.name.trim()) er.name = "Enter your name.";
    if (!validPhone(f.phone)) er.phone = "Enter a valid mobile number, e.g. 0917 123 4567.";
    if (!validEmail(f.email.trim())) er.email = "Enter a valid email address.";
    if (!(pl >= court.min_players && pl <= court.max_players)) er.players = `Players must be between ${court.min_players} and ${court.max_players}.`;
    if (!rent) er.rent = "Choose Yes or No.";
    else if (rent === "yes" && !Object.values(equip).some((v) => v > 0)) er.rent = "Add at least one item, or choose No.";
    setErrs(er);
    setFormErr("");
    if (Object.keys(er).length) return;
    try { localStorage.setItem(LAST_KEY, JSON.stringify({ name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() })); } catch {}
    start(async () => {
      const r = await addToCartAction({
        courtId: court.id, date, hours: slots, players: pl, equipment: rent === "yes" ? equip : {},
        name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), claim: claim?.token,
      });
      if (!r.ok) {
        setFormErr(r.error ?? "Something went wrong.");
        if (r.error?.includes("taken")) { setSlots([]); setStep(3); loadDay(); }
        return;
      }
      window.dispatchEvent(new Event("cart-changed"));
      router.push("/cart");
    });
  };

  return (
    <>
      <div className="stepper" role="list">
        {[["Court", court ? court.name : "Choose"], ["Date", date ? fmtDate(date) : "Choose"], ["Time", slots.length ? `${slots.length} hr` : "Choose"], ["Details", "Players & gear"]].map(([t, s], i) => {
          const n = i + 1;
          return (
            <button key={t} role="listitem" className={step === n ? "on" : step > n ? "done" : ""} disabled={!can(n)} aria-current={step === n ? "step" : undefined} onClick={() => setStep(n)}>
              <b>{n}. {t}</b><span>{s}</span>
            </button>
          );
        })}
      </div>
      <div className="book-grid">
        <div>
          {step === 1 && (
            <div className="panel">
              <h2 style={{ fontSize: "1.3rem" }}>Choose a court</h2>
              <div className="pick-courts">
                {courts.map((c, i) => (
                  <button key={c.id} className={"pick" + (courtId === c.id ? " sel" : "")} aria-pressed={courtId === c.id} onClick={() => pickCourt(c.id)}>
                    <Ph kind={courtArt(c.type)} tone={TONES[i % 3]} label={c.name} />
                    <span className="b"><b>{c.name}</b><small>{peso(c.rate)} / hr · {c.min_players}–{c.max_players} players · {c.note}</small></span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 2 && court && <DateStep {...{ court, month, setMonth, days, date, today, max, pickDate }} />}
          {step === 3 && court && date && (
            <TimeStep {...{ court, date, states, slots, setSlots, pStart, setPStart, adding, setAdding, hoverEnd, setHoverEnd }}
              onWait={(h) => setWait(h)} onContinue={() => setStep(4)} />
          )}
          {step === 4 && court && date && (
            <form className="panel" onSubmit={submit} noValidate>
              <h2 style={{ fontSize: "1.3rem" }}>Your details</h2>
              {claim ? <div className="banner lime">You are claiming a waitlisted slot. Finish before the hold runs out ({fmtTs(claim.expires)}).</div> : null}
              <div className="form-grid">
                <Field label="Name" err={errs.name}><input className="inp" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
                <Field label="Number" err={errs.phone}><input className="inp" type="tel" autoComplete="tel" placeholder="0917 123 4567" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
                <Field label="Email" err={errs.email}><input className="inp" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
                <Field label={`Number of players (${court.min_players}–${court.max_players})`} err={errs.players}>
                  <input className="inp" type="number" min={court.min_players} max={court.max_players} value={f.players} onChange={(e) => setF({ ...f, players: e.target.value })} />
                </Field>
              </div>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
                <legend style={{ fontWeight: 600, marginBottom: 10 }}>Rent equipment?</legend>
                <div className="seg">
                  <label><input type="radio" name="rent" checked={rent === "yes"} onChange={() => setRent("yes")} /> Yes</label>
                  <label><input type="radio" name="rent" checked={rent === "no"} onChange={() => setRent("no")} /> No</label>
                </div>
                {errs.rent ? <em className="err">{errs.rent}</em> : null}
                {rent === "yes" && (
                  <div className="eq-list">
                    {eqForCourt.map((it) => {
                      const av = free[it.id] ?? 0, q = Math.min(equip[it.id] || 0, av);
                      return (
                        <div className="eq" key={it.id}>
                          <div><b>{it.name}</b><small>{peso(it.rate)} per item, per hour · {av ? `${av} available for your time` : "Not available for this time"}</small></div>
                          <div className="qty">
                            <button type="button" aria-label={`Fewer ${it.name}`} onClick={() => setEquip({ ...equip, [it.id]: Math.max(0, q - 1) })}>−</button>
                            <output>{q}</output>
                            <button type="button" aria-label={`More ${it.name}`} disabled={q >= av} onClick={() => setEquip({ ...equip, [it.id]: Math.min(av, q + 1) })}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </fieldset>
              {formErr ? <p className="err">{formErr}</p> : null}
              <div className="row">
                <button className="btn btn-lime" type="submit" disabled={pending}>{pending ? "Adding…" : "Add to cart"}</button>
                <button className="btn btn-ghost" type="button" onClick={() => setStep(3)}>Back</button>
              </div>
            </form>
          )}
        </div>
        <aside className="summary">
          <h4>Booking summary</h4>
          <div className="line"><span>Court</span><span>{court?.name ?? "—"}</span></div>
          <div className="line"><span>Date</span><span>{date ? fmtDate(date) : "—"}</span></div>
          <div className="line"><span>Time</span><span style={{ textAlign: "right" }}>{slots.length ? fmtRange(slots) : "—"}</span></div>
          {court && slots.length ? <div className="line"><span>{peso(court.rate)} × {slots.length} hr</span><span className="tabnum">{peso(court.rate * slots.length)}</span></div> : null}
          {eqForCourt.filter((it) => (eqUsed[it.id] || 0) > 0).map((it) => (
            <div className="line" key={it.id}><span>{eqUsed[it.id]} × {it.name} × {slots.length} hr</span><span className="tabnum">{peso(it.rate * eqUsed[it.id] * slots.length)}</span></div>
          ))}
          <div className="line total"><span>Total</span><span className="tabnum">{peso(total)}</span></div>
          <p className="muted" style={{ fontSize: ".78rem" }}>{claim ? "Waitlist claim: your slot is held until " + fmtTs(claim.expires) + "." : "Slots are held for 15 minutes once added to your cart."}</p>
        </aside>
      </div>
      {wait !== null && court && date ? <WaitlistDialog court={court} date={date} hour={wait} onClose={() => setWait(null)} /> : null}
    </>
  );
}

function Field({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return <label className="f"><span>{label}</span>{children}{err ? <em className="err">{err}</em> : null}</label>;
}

/* ---------- Step 2: month calendar ---------- */
function DateStep({ court, month, setMonth, days, date, today, max, pickDate }: {
  court: Court; month: string; setMonth: (m: string) => void; days: Day[] | null; date: string | null; today: string; max: string; pickDate: (k: string) => void;
}) {
  const shift = (n: number) => { const [y, m] = month.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`); };
  const lead = (weekday(`${month}-01`) + 6) % 7;
  const n = daysInMonth(month);
  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between" }}><h2 style={{ fontSize: "1.3rem" }}>Choose a date</h2><span className="muted" style={{ fontSize: ".88rem" }}>{court.name}</span></div>
      <div className="cal-box">
        <div className="cal-nav">
          <button className="x" aria-label="Previous month" disabled={month <= today.slice(0, 7)} onClick={() => shift(-1)}><Arrow dir="l" /></button>
          <b>{fmtMonth(month)}</b>
          <button className="x" aria-label="Next month" disabled={month >= max.slice(0, 7)} onClick={() => shift(1)}><Arrow /></button>
        </div>
        <div className="cal-grid" role="group" aria-label="Dates">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => <span className="cal-wd" key={w}>{w}</span>)}
          {Array.from({ length: lead }, (_, i) => <span key={"b" + i} aria-hidden="true" />)}
          {Array.from({ length: n }, (_, i) => {
            const k = `${month}-${String(i + 1).padStart(2, "0")}`;
            const d = days?.find((x) => x.date === k);
            const out = k < today || k > max;
            const off = out || !d || d.closed;
            const lab = !d ? (out ? (k < today ? "" : "Not yet open") : "…") : out ? (k < today ? "" : "Not yet open") : d.closed ? "Closed" : d.open === 0 ? "Full" : `${d.open} open`;
            const cls = "cal-day" + (date === k ? " sel" : "") + (k === today ? " today" : "") + (off ? " off" : d!.open === 0 ? " full" : "");
            return (
              <button key={k} className={cls} disabled={off} aria-pressed={date === k} aria-label={`${fmtDateLong(k)}${lab ? ", " + lab : ""}`} onClick={() => pickDate(k)}>
                <b>{i + 1}</b><span className="av">{lab}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="legend"><span><i className="s" />Selected</span><span><i style={{ background: "var(--surface)", boxShadow: "inset 0 0 0 2px var(--accent-2)" }} />Today</span><span><i className="t" />Full (waitlist available)</span></div>
      <p className="muted" style={{ fontSize: ".86rem" }}>You can book up to 1 month ahead (until {fmtDateLong(max)}). Full days can still be opened to join the waitlist.</p>
    </div>
  );
}

/* ---------- Step 3: start / end time grid (spec §6 Step 3, v4.12) ---------- */
function TimeStep(p: {
  court: Court; date: string; states: Record<number, SlotState> | null; slots: number[]; setSlots: (s: number[]) => void;
  pStart: number | null; setPStart: (h: number | null) => void; adding: boolean; setAdding: (b: boolean) => void;
  hoverEnd: number | null; setHoverEnd: (h: number | null) => void; onWait: (h: number) => void; onContinue: () => void;
}) {
  const { court, date, states, slots, setSlots, pStart, setPStart, adding, setAdding, hoverEnd, setHoverEnd } = p;
  const st = (h: number): SlotState => states?.[h] ?? "past";
  const isFree = (h: number) => st(h) === "open" && !slots.includes(h);
  const picking = !slots.length || adding;
  const s = picking && pStart !== null && isFree(pStart) ? pStart : null;
  const lim = useMemo(() => { if (s === null) return -1; let l = s; while (l + 1 < CLOSE_HOUR && isFree(l + 1)) l++; return l; }, [s, states, slots]); // eslint-disable-line react-hooks/exhaustive-deps
  const anyFree = HOURS.some(isFree);
  const ending = picking && s !== null;
  const blocks = toRanges(slots);

  if (!states) return <div className="panel"><p className="muted">Loading open times…</p></div>;

  const endBtn = (h: number, note: string) => {
    const n = h - s!;
    return (
      <button key={"e" + h} className={"slot open endpick" + (hoverEnd !== null && h < hoverEnd ? " rng" : "")} aria-label={`End at ${fmtH(h)}, ${n} hour${n > 1 ? "s" : ""}`}
        onMouseEnter={() => setHoverEnd(h)} onMouseLeave={() => setHoverEnd(null)}
        onClick={() => { const add: number[] = []; for (let x = s!; x < h; x++) add.push(x); setSlots([...slots, ...add].sort((a, b) => a - b)); setPStart(null); setAdding(false); setHoverEnd(null); }}>
        <b>{fmtH(h)}</b><small>{note ? note + " · " : ""}End here · {n} hr{n > 1 ? "s" : ""}</small>
      </button>
    );
  };
  const LBL: Partial<Record<SlotState, string>> = { taken: "Booked", reserved: "Held", cart: "In cart", closed: "Closed", class: "Class" };

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between" }}><h2 style={{ fontSize: "1.3rem" }}>Choose time slot</h2><span className="muted" style={{ fontSize: ".88rem" }}>{court.name} · {fmtDate(date)}</span></div>
      {blocks.length ? (
        <div className="blocks">
          {blocks.map(([a, b], i) => (
            <div className="block" key={a}>
              <span className="bn">Time slot {i + 1}</span><b>{fmtH(a)} – {fmtH(b + 1)}</b><span className="muted tabnum">{b - a + 1} hr{b > a ? "s" : ""}</span>
              <button className="linkbtn" onClick={() => { const n = slots.filter((h) => h < a || h > b); setSlots(n); if (!n.length) setAdding(false); }}>Remove</button>
            </div>
          ))}
        </div>
      ) : null}
      {!picking ? <p className="tp-hint">Your time is added. Add another time slot or continue.</p>
        : !anyFree ? <p className="tp-hint">No more open times on this day. Join the waitlist for a booked hour, or pick another date.</p>
        : s === null ? <p className="tp-hint"><span className="tp-step">1</span> Click your <b>start time</b>.</p>
        : <p className="tp-hint"><span className="tp-step">2</span> Start: <b>{fmtH(s)}</b>. Now click your <b>end time</b>. <button className="linkbtn" onClick={() => setPStart(null)}>Change start time</button></p>}
      <div className={"slots" + (ending ? " ending" : "")}>
        {HOURS.map((h) => {
          const v = st(h), mine = slots.includes(h);
          if (ending && h === s) return <div key={h} className="slot open info endpick is-start"><b>{fmtH(h)}</b><small>Your start</small></div>;
          if (ending && h > s! && h <= lim) return endBtn(h, "");
          if (ending && h === lim + 1) return endBtn(h, mine ? "Your time" : LBL[v] ?? "");
          if (mine) return <div key={h} className="slot sel info"><b>{fmtH(h)}</b><small>Your time</small></div>;
          if (v === "taken" || v === "reserved") return <div key={h} className={"slot " + v}><b>{fmtH(h)}</b><button className="wl" onClick={() => p.onWait(h)}>{v === "taken" ? "Booked" : "Held"} · Join waitlist</button></div>;
          if (v === "cart") return <div key={h} className="slot cart"><b>{fmtH(h)}</b><small>In your cart</small></div>;
          if (v === "closed") return <div key={h} className="slot past"><b>{fmtH(h)}</b><small>Closed</small></div>;
          if (v === "class") return <div key={h} className="slot past"><b>{fmtH(h)}</b><small>Class</small></div>;
          if (v === "past") return <div key={h} className="slot past"><b>{fmtH(h)}</b><small>Passed</small></div>;
          if (picking && s === null) return <button key={h} className="slot open" onClick={() => setPStart(h)}><b>{fmtH(h)}</b><small>Start here</small></button>;
          return <div key={h} className={"slot open info" + (picking && s !== null ? " dim" : "")}><b>{fmtH(h)}</b><small>Open</small></div>;
        })}
        {ending && lim + 1 === CLOSE_HOUR ? endBtn(CLOSE_HOUR, "Closing") : null}
      </div>
      <div className="legend"><span><i />Open</span><span><i className="s" />Your time</span><span><i className="t" />Booked (waitlist)</span><span><i className="c" />In your cart</span></div>
      <div className="row">
        {!picking ? (anyFree ? <button className="btn btn-lav" onClick={() => { setAdding(true); setPStart(null); }}>+ Add time slot</button> : null)
          : slots.length ? <button className="btn btn-ghost" onClick={() => { setAdding(false); setPStart(null); }}>Cancel</button> : null}
        <button className="btn btn-lime" disabled={!slots.length || s !== null} onClick={p.onContinue}>Continue</button>
      </div>
    </div>
  );
}

/* ---------- Apply for the waitlist (spec §9) ---------- */
function WaitlistDialog({ court, date, hour, onClose }: { court: Court; date: string; hour: number; onClose: () => void }) {
  const last = typeof window !== "undefined" ? loadLast() : {};
  const [f, setF] = useState({ name: last.name ?? "", phone: last.phone ?? "", email: last.email ?? "", players: String(court.min_players) });
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pl = parseInt(f.players, 10);
    if (!f.name.trim()) return setErr("Enter your name.");
    if (!validPhone(f.phone)) return setErr("Enter a valid mobile number.");
    if (!validEmail(f.email.trim())) return setErr("Enter a valid email address.");
    if (!(pl >= court.min_players && pl <= court.max_players)) return setErr(`Players must be between ${court.min_players} and ${court.max_players}.`);
    start(async () => {
      const r = await joinWaitlistAction({ courtId: court.id, date, hour, name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), players: pl });
      if (!r.ok) setErr(r.error ?? "Something went wrong.");
      else setDone(true);
    });
  };
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="wl-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div><p className="eyebrow">Apply for the waitlist</p><h2 id="wl-title" style={{ fontSize: "1.2rem", marginTop: 6 }}>{court.name}</h2><p className="muted" style={{ fontSize: ".9rem", marginTop: 4 }}>{fmtDateLong(date)} · {fmtRange([hour])}</p></div>
          <button className="x" aria-label="Close" onClick={onClose}>×</button>
        </div>
        {done ? (
          <>
            <div className="banner lime">Application sent. An admin will review it, and we will email you once you are in line.</div>
            <div className="row"><button className="btn btn-ghost" onClick={onClose}>Close</button></div>
          </>
        ) : (
          <>
            <p className="muted" style={{ fontSize: ".9rem" }}>Apply to join the waitlist. Once an admin approves you, you are added to the line. If this slot frees up, the first person in line gets an email with a link that holds it for 2 hours. If they don&apos;t claim it, the next person is emailed.</p>
            <form className="form-grid" onSubmit={submit} noValidate>
              <label className="f"><span>Name</span><input className="inp" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
              <label className="f"><span>Number</span><input className="inp" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
              <label className="f"><span>Email</span><input className="inp" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label className="f"><span>Players ({court.min_players}–{court.max_players})</span><input className="inp" type="number" min={court.min_players} max={court.max_players} value={f.players} onChange={(e) => setF({ ...f, players: e.target.value })} /></label>
              {err ? <em className="err full">{err}</em> : null}
              <div className="row full"><button className="btn btn-lav" type="submit" disabled={pending}>{pending ? "Sending…" : "Apply for waitlist"}</button></div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
