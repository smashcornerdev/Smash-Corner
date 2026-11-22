"use client";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { glideTo, useTabPill } from "./tabMotion";

const TABS = [
  { id: "pe-programs", label: "Programs" },
  { id: "pe-events", label: "Upcoming events" },
  { id: "pe-coaches", label: "Coaches" },
];

/* Programs & Events jump tabs (spec §2, §4; same behavior as the Gallery tabs, v5.58): the row sticks under the site header,
   stays side by side on phones, a click glides the page to its section, and a lavender highlight slides to the tab of the
   section on screen (scroll-spy), also during a glide. Still plain #links underneath, so they work without JavaScript. */
export default function PeTabs() {
  const [active, setActive] = useState(TABS[0].id);
  const bar = useRef<HTMLDivElement>(null), list = useRef<HTMLElement>(null), pill = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const y = (bar.current?.getBoundingClientRect().bottom ?? 0) + 40;
      let cur = TABS[0].id;
      for (const t of TABS) {
        const el = document.getElementById(t.id);
        if (el && el.getBoundingClientRect().top <= y) cur = t.id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useTabPill(list, pill, active);

  const jump = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id), b = bar.current;
    if (!el || !b) return;
    e.preventDefault();
    e.currentTarget.blur(); // the highlight belongs to the section on screen, not to the tab that was clicked
    // land just under the stuck tab row: its sticky top (the header's height) + its height + a little air
    glideTo(el, (parseFloat(getComputedStyle(b).top) || 0) + b.offsetHeight + 16);
  };
  return (
    <div className="pe-tabs" ref={bar}>
      <nav className="chips" ref={list} aria-label="On this page">
        {/* grey tab backgrounds, then the sliding highlight, both under the tab text: same build as the Gallery tabs (v5.65) */}
        {TABS.map((t) => <span className="tab-slot" aria-hidden="true" key={t.id} />)}
        <span className="pe-pill" ref={pill} aria-hidden="true" />
        {TABS.map((t) => (
          <a key={t.id} className={"chip" + (active === t.id ? " on" : "")} href={"#" + t.id} aria-current={active === t.id ? "true" : undefined} onClick={(e) => jump(e, t.id)}>{t.label}</a>
        ))}
      </nav>
    </div>
  );
}
