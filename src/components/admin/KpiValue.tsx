"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { countUp } from "@/lib/gsap/countUp";
import { digitRoll } from "@/lib/gsap/digitRoll";

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FMT = {
  peso: (v: number) => "₱" + Math.round(v).toLocaleString("en-PH"),
  pct: (v: number) => (v * 100).toFixed(1) + "%",
};

/* Reports KPI number (spec §19). Money and percentages count up (GSAP countUp); a range or court change counts on from the
   old value. The final value is read out to screen readers and, invisibly, reserves the width so nothing shifts while it counts. */
export function CountUp({ value, kind }: { value: number; kind: keyof typeof FMT }) {
  const live = useRef<HTMLSpanElement>(null);
  const at = useRef(0); // where the last count stopped
  const fmt = FMT[kind], final = fmt(value);
  useLayoutEffect(() => {
    const el = live.current!;
    if (still()) { el.textContent = fmt(value); at.current = value; return; }
    return countUp(el, value, fmt, { from: at.current, onUpdate: (v) => { at.current = v; } });
  }, [value, fmt]);
  return (
    <span className="kv">
      <span className="sr-only">{final}</span>
      <span className="kv-ghost" aria-hidden="true">{final}</span>
      <span className="kv-live" aria-hidden="true" ref={live}>{fmt(0)}</span>
    </span>
  );
}

/* Whole-number KPI as an odometer (GSAP digitRoll): each digit's 0–9 strip rolls to its place; thousands get commas.
   Digits are keyed from the right so a range change rolls on from the previous number. */
export function DigitRoll({ value }: { value: number }) {
  const box = useRef<HTMLSpanElement>(null);
  const text = Math.max(0, Math.round(value)).toLocaleString("en-PH");
  const chars = [...text];
  const nDigits = chars.filter((c) => /\d/.test(c)).length;
  useEffect(() => {
    const strips = [...box.current!.querySelectorAll(".digit-strip")];
    const digits = chars.filter((c) => /\d/.test(c)).map(Number);
    if (still()) { strips.forEach((s, i) => gsap.set(s, { yPercent: -digits[i] * 10 })); return; }
    return digitRoll(strips, digits);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps -- chars comes from text
  let d = nDigits;
  return (
    <span className="roll" ref={box}>
      <span className="sr-only">{text}</span>
      {chars.map((c, i) => /\d/.test(c) ? (
        <span className="digit-win" aria-hidden="true" key={"d" + d--}>
          <span className="digit-strip">{Array.from({ length: 10 }, (_, n) => <span key={n}>{n}</span>)}</span>
        </span>
      ) : <span aria-hidden="true" key={"s" + i}>{c}</span>)}
    </span>
  );
}
