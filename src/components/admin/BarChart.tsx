"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { barChartGrow } from "@/lib/gsap/barChartGrow";

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Reports bar chart (spec §19): all bars grow up together over 2 s, easing in and out (GSAP barChartGrow, no stagger) when the chart scrolls into view.
   With reduced motion the bars are drawn at full height straight away (CSS). Click a bar (or focus it and press Enter)
   to open that day's details under the chart; click it again, press Esc or × to close.
   Clicking springs the bar; the panel slides open with its figures and rows fading up, and slides shut on close.
   Switching days with the panel open only replays the fade-up. Reduced motion turns all of it off. */
export default function BarChart({ label, bars, axis }: {
  label: string; axis?: React.ReactNode;
  bars: { key: string; pct: number; tip: string; title: string; detail: React.ReactNode }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const panel = useRef<HTMLElement>(null);
  const shown = useRef(false); // panel already on screen (switching days, not opening)
  const closing = useRef<gsap.core.Tween | null>(null);
  const sig = bars.map((b) => b.pct).join(",");
  useEffect(() => {
    if (still()) return;
    return barChartGrow(sig.split(",").map(Number), ref.current, { duration: 2, stagger: 0, ease: "power2.inOut" });
  }, [sig]);
  const cur = bars.find((b) => b.key === sel);
  const close = () => {
    const el = panel.current;
    if (!el || still()) { shown.current = false; setSel(null); return; }
    closing.current = gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => { closing.current = null; shown.current = false; setSel(null); } });
  };
  const pick = (key: string, btn: HTMLElement) => {
    if (closing.current) { closing.current.kill(); closing.current = null; if (panel.current) gsap.set(panel.current, { clearProps: "height,opacity" }); }
    if (!still()) gsap.fromTo(btn.firstElementChild, { scaleY: 0.88 }, { scaleY: 1, duration: 0.55, ease: "back.out(4)", transformOrigin: "50% 100%", clearProps: "transform" });
    if (key === sel) close(); else setSel(key);
  };
  // open: slide the panel down, then fade the figures and rows up; switching days: only the fade-up
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el || !sel) return;
    if (still()) { shown.current = true; return; }
    const first = !shown.current;
    shown.current = true;
    const ctx = gsap.context(() => {
      if (first) gsap.from(el, { height: 0, opacity: 0, duration: 0.45, ease: "power2.out", clearProps: "height,opacity" });
      gsap.from(".bar-stats > div, tbody tr, .bar-empty", { y: 10, opacity: 0, duration: 0.35, stagger: 0.035, ease: "power2.out", delay: first ? 0.15 : 0, clearProps: "transform,opacity" });
    }, el);
    if (first) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return () => ctx.revert();
  }, [sel]);
  useEffect(() => {
    if (!cur) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [cur]);
  return (
    <>
      <div className="chart-scroll">
        <div className="chart-inner">
          <div className="chart" ref={ref} role="group" aria-label={label}>
            {bars.map((b) => (
              <button type="button" className={"bar-col" + (b.key === sel ? " on" : "")} key={b.key} title={b.tip} aria-label={b.tip}
                aria-pressed={b.key === sel} aria-controls="bar-detail" onClick={(e) => pick(b.key, e.currentTarget)}>
                <span className="bar-fill" style={{ "--h": `${b.pct}%` } as React.CSSProperties} />
              </button>
            ))}
          </div>
          {axis}
        </div>
      </div>
      {cur ? (
        <section className="bar-detail" id="bar-detail" ref={panel} aria-live="polite" aria-label={cur.title}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h4>{cur.title}</h4>
            <button type="button" className="x" aria-label="Close details" onClick={close}>×</button>
          </div>
          {cur.detail}
        </section>
      ) : <p className="muted" style={{ fontSize: ".82rem", margin: 0 }}>Click a bar to see that day&apos;s details.</p>}
    </>
  );
}
