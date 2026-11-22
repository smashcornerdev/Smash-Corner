"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { stepSwap } from "@/lib/gsap/stepSwap";
import { useSearchParams } from "next/navigation";

/* Book page tabs (spec §6): switching tabs swaps only the panel below; the URL (?mode=) is updated with
   history.pushState, which Next keeps in sync with useSearchParams without a server round trip.
   A panel is only mounted the first time its tab is opened, so its data (dates, times, classes) loads then and not before;
   the tab the page opens on gets its data with the page. After that it stays mounted (hidden when inactive), so nothing
   reloads and a half-filled form survives switching back. Add the coach tab here later.
   Switching is animated (v5.35): a violet pill slides behind the chosen tab, and the panel slides in from the side you moved
   toward (later tab: from the right; earlier tab: from the left). Reduced motion: the pill jumps, the panel just appears. */
/** count: e.g. the "N open" badge; a node so it can stream in after the tabs (v6.04) and render its own <span className="c"> */
export type BookTab = { id: string; label: string; count?: ReactNode; panel: ReactNode };

export default function BookTabs({ tabs }: { tabs: BookTab[] }) {
  const sp = useSearchParams();
  const active = tabs.some((t) => t.id === sp.get("mode")) ? sp.get("mode")! : tabs[0].id;
  const [seen, setSeen] = useState<string[]>([active]);
  if (!seen.includes(active)) setSeen([...seen, active]);

  const bar = useRef<HTMLDivElement>(null), pill = useRef<HTMLSpanElement>(null), panels = useRef<HTMLDivElement>(null);
  const prev = useRef(active);
  // the pill copies the active tab's box; it follows on resize (wrapping on phones, late fonts) without animating
  useLayoutEffect(() => {
    const b = bar.current!, p = pill.current!;
    const place = (animate: boolean) => {
      const on = b.querySelector<HTMLElement>("button.on");
      if (!on) return;
      // layout box, not getBoundingClientRect: the page entrance has the tabs shifted while they slide in
      const to = { x: on.offsetLeft, y: on.offsetTop, width: on.offsetWidth, height: on.offsetHeight };
      if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) gsap.to(p, { ...to, duration: 0.45, ease: "power3.out" });
      else gsap.set(p, to);
    };
    const moved = prev.current !== active;
    place(moved);
    b.classList.add("ready");
    let undo = () => {};
    if (moved) {
      const dir = tabs.findIndex((t) => t.id === active) > tabs.findIndex((t) => t.id === prev.current) ? 1 : -1;
      prev.current = active;
      undo = stepSwap(panels.current?.querySelector(`[data-tab="${active}"]`) ?? null, dir);
    }
    const ro = new ResizeObserver(() => place(false));
    ro.observe(b);
    b.querySelectorAll("button").forEach((x) => ro.observe(x)); // a tab widens when its streamed count arrives (v6.04)
    return () => { ro.disconnect(); undo(); };
  }, [active, tabs]);

  const go = (id: string) => {
    if (id === active) return;
    const q = new URLSearchParams(sp.toString());
    if (id === tabs[0].id) q.delete("mode"); else q.set("mode", id);
    const s = q.toString();
    window.history.pushState(null, "", s ? `?${s}` : window.location.pathname);
  };

  return (
    <>
      <div className="mode-sw" ref={bar} role="group" aria-label="What are you booking?">
        <span className="mode-sw-pill" ref={pill} aria-hidden="true" />
        {tabs.map((t) => (
          <button key={t.id} type="button" className={t.id === active ? "on" : ""} aria-pressed={t.id === active} onClick={() => go(t.id)}>
            {t.label}{t.count}
          </button>
        ))}
      </div>
      <div ref={panels}>{tabs.filter((t) => seen.includes(t.id)).map((t) => <div key={t.id} data-tab={t.id} hidden={t.id !== active}>{t.panel}</div>)}</div>
    </>
  );
}
