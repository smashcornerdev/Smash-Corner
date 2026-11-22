"use client";
import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { addDaysKey, daysInMonth, fmtDateLong, fmtMonth, parseKey, weekday } from "@/lib/time";

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const short = (k: string, today: string) => {
  const { m, d } = parseKey(k), day = `${WD[weekday(k)]} ${MO[m - 1]} ${d}`;
  return k === today ? `Today, ${day}` : k === addDaysKey(today, 1) ? `Tomorrow, ${day}` : day;
};
const shiftMonth = (mo: string, n: number) => { const [y, m] = mo.split("-").map(Number), t = y * 12 + (m - 1) + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`; };

/* Home search bar date (spec §4/§3, v5.30): a button showing the picked day ("Today, Tue Nov 3") that opens a month calendar
   (today to the end of the 1-month booking window; other days greyed out). Picking a day closes it. The value goes in a hidden
   `date` input, so the form still submits today's date without JavaScript. Esc or a click outside closes it. */
export default function HeroDatePicker({ today, max }: { today: string; max: string }) {
  const [date, setDate] = useState(today);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(today.slice(0, 7));
  const box = useRef<HTMLDivElement>(null), pop = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null), live = useRef<HTMLSpanElement>(null);
  // every label the window can show, stacked invisibly in the same cell, so the button is always as wide as the longest one and
  // the bar never changes size when the date changes (v5.31)
  const labels = useMemo(() => { const out: string[] = []; for (let k = today; k <= max; k = addDaysKey(k, 1)) out.push(short(k, today)); return out; }, [today, max]);
  const first = useRef(true);
  useLayoutEffect(() => { // the new date rolls up into place (v5.31)
    if (first.current) { first.current = false; return; }
    if (!live.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(live.current, { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out", clearProps: "transform,opacity,visibility" });
  }, [date]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  useLayoutEffect(() => { // open upward when there's no room below (the bar sits near the bottom of the first screen), drop in, focus the picked day
    const el = pop.current;
    if (!open || !el) return;
    const r = el.getBoundingClientRect(), above = box.current!.getBoundingClientRect().top;
    const up = r.bottom > window.innerHeight - 8 && above > r.height + 18;
    el.classList.toggle("up", up);
    el.querySelector<HTMLButtonElement>("[aria-pressed=true]")?.focus({ preventScroll: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(el, { autoAlpha: 0, y: up ? 8 : -8 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out", clearProps: "opacity,visibility,transform" });
  }, [open]);

  const n = daysInMonth(month), lead = (weekday(`${month}-01`) + 6) % 7; // Monday first
  const pick = (k: string) => { setDate(k); setOpen(false); btn.current?.focus(); };
  return (
    <div className="q-date" ref={box}>
      <input type="hidden" name="date" value={date} />
      <button type="button" ref={btn} className="q-date-btn" aria-haspopup="dialog" aria-expanded={open} aria-label={`Date: ${fmtDateLong(date)}. Change date`}
        onClick={() => { setMonth(date.slice(0, 7)); setOpen((o) => !o); }}>
        <span>Date</span>
        <b className="q-date-val">
          {labels.map((l) => <i key={l} aria-hidden="true">{l}</i>)}
          <span ref={live} key={date}>{short(date, today)}</span>
        </b>
      </button>
      {open ? (
        <div className="q-cal" ref={pop} role="dialog" aria-label="Choose a date">
          <div className="q-cal-nav">
            <button type="button" aria-label="Previous month" disabled={month <= today.slice(0, 7)} onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
            <b>{fmtMonth(month)}</b>
            <button type="button" aria-label="Next month" disabled={month >= max.slice(0, 7)} onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
          </div>
          <div className="q-cal-grid">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((w) => <span key={w} className="q-cal-wd" aria-hidden="true">{w}</span>)}
            {Array.from({ length: lead }, (_, i) => <span key={"b" + i} />)}
            {Array.from({ length: n }, (_, i) => {
              const k = `${month}-${String(i + 1).padStart(2, "0")}`, out = k < today || k > max;
              return (
                <button type="button" key={k} disabled={out} aria-pressed={k === date} aria-label={fmtDateLong(k) + (k === today ? ", today" : "")}
                  className={"q-day" + (k === date ? " sel" : "") + (k === today ? " today" : "")} onClick={() => pick(k)}>{i + 1}</button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
