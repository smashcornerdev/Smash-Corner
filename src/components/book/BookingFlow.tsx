"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Arrow, CourtImg, TONES } from "@/components/art";
import { addToCartAction, joinWaitlistAction } from "@/app/actions/booking";
import { CLOSE_HOUR, HOURS } from "@/lib/config";
import { peso, validEmail, validPhone } from "@/lib/format";
import { addDaysKey, daysInMonth, fmtDate, fmtDateLong, fmtH, fmtMonth, fmtRange, fmtTs, toRanges, weekday } from "@/lib/time";
import type { Court, EquipmentItem } from "@/lib/types";
import { type BtnLook, btnDim, btnIn, btnLit, btnLook, hintSwap, listReveal, slotIn, slotOut, stepSwap } from "@/lib/gsap/stepSwap";
import SummaryLines from "@/components/book/SummaryLines";
import { itemFee, unitLabel } from "@/lib/pricing";

type SlotState = "past" | "closed" | "class" | "taken" | "reserved" | "cart" | "open";
type Day = { date: string; open: number; closed: boolean; bookable: boolean };
/** court → date → hour → state for the whole bookable window (from the page, or /api/availability?window=1) */
export type Avail = Record<string, Record<string, Record<number, SlotState>>>;
export type Claim = { token: string; courtId: string; date: string; hour: number; name: string; email: string; phone: string; players: number; expires: string };

const LAST_KEY = "sc-last-details";
const loadLast = () => { try { return JSON.parse(localStorage.getItem(LAST_KEY) || "{}"); } catch { return {}; } };

/* Court booking: Court → Date → Time → Details & Equipment → cart (spec §6) */
export default function BookingFlow(props: { courts: Court[]; items: EquipmentItem[]; today: string; max: string; avail?: Avail; initCourt?: string; initDate?: string; claim?: Claim }) {
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
  const [avail, setAvail] = useState<Avail | null>(props.avail ?? null);
  const [free, setFree] = useState<Record<string, number> | null>(null); // null while loading
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

  /* Date & time data (spec §6): sent with the page when this is the tab the Book page opens on, otherwise fetched once
     when the tab is first shown. Entering the Date or Time step refreshes it quietly in the background (no loading state). */
  const loadedAt = useRef(props.avail ? Date.now() : 0);
  const refresh = useCallback(async (force = true) => {
    if (!force && Date.now() - loadedAt.current < 30_000) return;
    loadedAt.current = Date.now();
    const r = await fetch(`/api/availability?window=1${claimQ}`, { cache: "no-store" }).catch(() => null);
    if (r?.ok) setAvail((await r.json()).avail);
  }, [claimQ]);
  useEffect(() => { if (step === 2 || step === 3 || !loadedAt.current) refresh(false); }, [step, refresh]);
  const states = (avail && courtId && date ? avail[courtId]?.[date] : null) ?? null;
  const days = useMemo<Day[] | null>(() => {
    const byDate = avail && courtId ? avail[courtId] : null;
    if (!byDate) return null;
    const out: Day[] = [];
    for (let d = `${month}-01`; d.slice(0, 7) === month; d = addDaysKey(d, 1)) {
      const st = byDate[d];
      if (!st) { out.push({ date: d, open: 0, closed: false, bookable: false }); continue; }
      const v = HOURS.map((h) => st[h]);
      out.push({ date: d, open: v.filter((x) => x === "open").length, closed: v.every((x) => x === "closed" || x === "past"), bookable: true });
    }
    return out;
  }, [avail, courtId, month]);
  useEffect(() => {
    if (step !== 4 || !date || !slots.length) return;
    setFree(null);
    fetch(`/api/equipment?date=${date}&hours=${slots.join(",")}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setFree(d.free ?? {})).catch(() => setFree({}));
  }, [step, date, slots]);
  useEffect(() => { if (court && !f.players) setF((x) => ({ ...x, players: String(court.min_players) })); }, [court, f.players]);

  /* ---------- price ---------- */
  const eqForCourt = court ? items.filter((i) => i.type === court.type) : [];
  const eqUsed = rent === "yes" ? equip : {};
  const total = court && slots.length
    ? court.rate * slots.length + eqForCourt.reduce((a, it) => a + itemFee(it, eqUsed[it.id] || 0, slots.length), 0) : 0;

  // a date carried in from the Home search bar (no court yet) is kept for the first court picked, which then goes straight to Time
  const pickCourt = (id: string) => {
    const keepDate = courtId === null && !!date;
    if (id !== courtId) { setCourtId(id); if (!keepDate) setDate(null); setSlots([]); setEquip({}); setPStart(null); setAdding(false); setF((x) => ({ ...x, players: "" })); }
    setStep(keepDate ? 3 : 2);
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
    if (!rent && eqForCourt.length) er.rent = "Choose Yes or No.";
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
        if (r.error?.includes("taken")) { setSlots([]); setStep(3); refresh(); }
        return;
      }
      window.dispatchEvent(new Event("cart-changed"));
      router.push("/cart");
    });
  };

  // the equipment list unfolds with its items one by one when Rent equipment? is set to Yes (v5.37)
  const eqList = useRef<HTMLDivElement>(null);
  const rentWas = useRef(rent);
  useLayoutEffect(() => {
    const was = rentWas.current;
    rentWas.current = rent;
    if (rent === "yes" && was !== "yes") return listReveal(eqList.current);
  }, [rent]);

  // step transition (v5.33): the new step slides in, from the right going forward, from the left going back
  const stepBox = useRef<HTMLDivElement>(null);
  const prevStep = useRef(step);
  useLayoutEffect(() => {
    if (prevStep.current === step) return;
    const dir = step > prevStep.current ? 1 : -1;
    prevStep.current = step;
    return stepSwap(stepBox.current?.firstElementChild ?? null, dir);
  }, [step]);

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
        <div ref={stepBox}>
          {step === 1 && (
            <div className="panel">
              <h2 style={{ fontSize: "1.3rem" }}>Choose a court</h2>
              <div className="pick-courts">
                {courts.map((c, i) => (
                  <button key={c.id} className={"pick" + (courtId === c.id ? " sel" : "")} aria-pressed={courtId === c.id} onClick={() => pickCourt(c.id)}>
                    <CourtImg id={c.id} type={c.type} tone={TONES[i % 3]} label={c.name} />
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
              {eqForCourt.length ? <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
                <legend style={{ fontWeight: 600, marginBottom: 10 }}>Rent equipment?</legend>
                <div className="seg">
                  <label><input type="radio" name="rent" checked={rent === "yes"} onChange={() => setRent("yes")} /> Yes</label>
                  <label><input type="radio" name="rent" checked={rent === "no"} onChange={() => setRent("no")} /> No</label>
                </div>
                {errs.rent ? <em className="err">{errs.rent}</em> : null}
                {rent === "yes" && (
                  <div className="eq-list" ref={eqList}>
                    {eqForCourt.map((it) => {
                      const av = free?.[it.id] ?? 0, q = Math.min(equip[it.id] || 0, av);
                      return (
                        <div className="eq" key={it.id}>
                          <div><b>{it.name}</b><small>{peso(it.rate)} per item, {unitLabel(it)} · {!free ? "Checking availability…" : av ? `${av} available for your time` : "Not available for this time"}</small></div>
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
              </fieldset> : null /* no rental items for this sport (all deleted, v6.05) */}
              {formErr ? <p className="err">{formErr}</p> : null}
              <div className="row">
                <button className="btn btn-lime no-edge" type="submit" disabled={pending}>{pending ? "Adding…" : "Add to cart"}</button>
                <button className="btn btn-ghost" type="button" onClick={() => setStep(3)}>Back</button>
              </div>
            </form>
          )}
        </div>
        <aside className="summary">
          <h4>Booking summary</h4>
          <SummaryLines lines={[
            { k: "court", label: "Court", value: court?.name ?? "—" },
            { k: "date", label: "Date", value: date ? fmtDate(date) : "—" },
            { k: "time", label: "Time", value: slots.length ? fmtRange(slots) : "—", valueStyle: { textAlign: "right" } },
            ...(court && slots.length ? [{ k: "rate", label: `${peso(court.rate)} × ${slots.length} hr`, value: peso(court.rate * slots.length), valueCls: "tabnum" }] : []),
            ...eqForCourt.filter((it) => (eqUsed[it.id] || 0) > 0).map((it) => (
              { k: "eq-" + it.id, label: `${eqUsed[it.id]} × ${it.name}${it.unit === "session" ? " (per session)" : ` × ${slots.length} hr`}`, value: peso(itemFee(it, eqUsed[it.id], slots.length)), valueCls: "tabnum" })),
            { k: "total", label: "Total", value: peso(total), cls: "total", valueCls: "tabnum" },
          ]} />
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
            // only the date is shown; full / closed days get their own shade, and the status is read out to screen readers (v5.13)
            const lab = out ? (k < today ? "" : "Not yet open") : !d ? "" : d.closed ? "Closed" : d.open === 0 ? "Full, waitlist available" : "";
            const cls = "cal-day" + (date === k ? " sel" : "") + (k === today ? " today" : "") + (off ? " off" : d!.open === 0 ? " full" : "");
            return (
              <button key={k} className={cls} disabled={off} aria-pressed={date === k} aria-label={`${fmtDateLong(k)}${lab ? ", " + lab : ""}`} onClick={() => pickDate(k)}>
                <b>{i + 1}</b>
              </button>
            );
          })}
        </div>
      </div>
      <div className="legend"><span><i className="s" />Selected</span><span><i style={{ background: "var(--surface)", boxShadow: "inset 0 0 0 2px var(--accent-2)" }} />Today</span><span><i className="f" />Full (waitlist available)</span><span><i className="t" />Closed / not bookable</span></div>
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
  // a new or changed "Time slot N" card animates in (v5.33); the ones already there when the step opens don't
  const blocksBox = useRef<HTMLDivElement>(null);
  // the buttons under the grid animate as they change (v5.38/v5.39), not when the step opens: Continue and "+ Add time slot"
  // light up when they become clickable and fade back to shaded when they stop being clickable; Cancel / Add slide in when
  // one replaces the other. "+ Add time slot" is always shown, shaded until there's a time slot (or when nothing is free).
  const canGo = slots.length > 0 && s === null;
  const extraBtn = picking && slots.length ? "cancel" : "add";
  const addOn = !picking && anyFree;
  const goRef = useRef<HTMLButtonElement>(null), extraRef = useRef<HTMLButtonElement>(null);
  const btnsWas = useRef<{ canGo: boolean; extraBtn: string; addOn: boolean; go: BtnLook | null; extra: BtnLook | null } | null>(null);
  useLayoutEffect(() => {
    const was = btnsWas.current, go = goRef.current, extra = extraRef.current;
    if (was) {
      if (canGo !== was.canGo) { if (canGo) btnLit(go); else btnDim(go, was.go); }
      if (extraBtn !== was.extraBtn) btnIn(extra);
      else if (extraBtn === "add" && addOn !== was.addOn) { if (addOn) btnLit(extra); else btnDim(extra, was.extra); }
    }
    btnsWas.current = { canGo, extraBtn, addOn, go: btnLook(go), extra: btnLook(extra) };
  }, [canGo, extraBtn, addOn]);
  // the hint card's content animates each time it changes (v5.36), not when the step opens
  const hintKey = !picking ? "added" : !anyFree ? "full" : s === null ? "start" : "end-" + s;
  const hintBox = useRef<HTMLParagraphElement>(null);
  const hintWas = useRef<{ key: string; h: number } | null>(null);
  useLayoutEffect(() => {
    const was = hintWas.current, el = hintBox.current;
    if (was && was.key !== hintKey) hintSwap(el, was.h);
    hintWas.current = { key: hintKey, h: el?.offsetHeight ?? 0 };
  }, [hintKey]);
  const slotsNow = useRef(slots); // the removal finishes after its animation, so it reads the latest slots (two quick removals)
  useEffect(() => { slotsNow.current = slots; }, [slots]);
  const seenBlocks = useRef<Set<string> | null>(null);
  const blockKeys = blocks.map(([a, b]) => `${a}-${b}`).join(",");
  useLayoutEffect(() => {
    const keys = blockKeys ? blockKeys.split(",") : [];
    const prev = seenBlocks.current;
    seenBlocks.current = new Set(keys);
    if (!prev) return;
    slotIn(Array.from(blocksBox.current?.children ?? []).filter((el) => !prev.has((el as HTMLElement).dataset.k ?? "")));
  }, [blockKeys]);

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
        <div className="blocks" ref={blocksBox}>
          {blocks.map(([a, b], i) => (
            <div className="block" key={a} data-k={`${a}-${b}`}>
              <span className="bn">Time slot {i + 1}</span><b>{fmtH(a)} – {fmtH(b + 1)}</b><span className="muted tabnum">{b - a + 1} hr{b > a ? "s" : ""}</span>
              <button className="x block-x" aria-label={`Remove time slot ${i + 1}, ${fmtH(a)} – ${fmtH(b + 1)}`} title="Remove"
                onClick={(e) => slotOut(e.currentTarget.closest<HTMLElement>(".block"), () => { const n = slotsNow.current.filter((h) => h < a || h > b); setSlots(n); if (!n.length) setAdding(false); })}>
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <p className="tp-hint" ref={hintBox}><span className="tp-in">
        {!picking ? "Your time is added. Add another time slot or continue."
          : !anyFree ? "No more open times on this day. Join the waitlist for a booked hour, or pick another date."
          : s === null ? <><span className="tp-step">1</span> Click your <b>start time</b>.</>
          : <><span className="tp-step">2</span> Start: <b>{fmtH(s)}</b>. Now click your <b>end time</b>. <button className="linkbtn" onClick={() => setPStart(null)}>Change start time</button></>}
      </span></p>
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
        {extraBtn === "add" ? <button key="add" ref={extraRef} className="btn btn-lav" disabled={!addOn} onClick={() => { setAdding(true); setPStart(null); }}>+ Add time slot</button>
          : <button key="cancel" ref={extraRef} className="btn btn-ghost" onClick={() => { setAdding(false); setPStart(null); }}>Cancel</button>}
        <button ref={goRef} className="btn btn-lime no-edge" disabled={!canGo} onClick={p.onContinue}>Continue</button>
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
