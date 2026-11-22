"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CalPop } from "@/app/api/admin/calendar/route";

/* Booking / class details card for the Admin Calendar (spec §7, v6.12), like Google Calendar's: clicking a booking opens a larger
   card beside it (right of it when there's room, else left; below it on narrow screens). It shows the details and an Open button
   for the full booking / class page. Closes with ×, Esc, a click outside it, or when the calendar's dates, view or filter change.
   Pops in quickly (scale + fade, 0.14 s; instant with reduced motion). */
export type PopState = { pop: CalPop; href: string; anchor: HTMLElement };

const W = 340, GAP = 10;

export default function CalPopover({ state, host, onClose, onOpen }: { state: PopState; host: HTMLElement; onClose: (refocus: boolean) => void; onOpen: (href: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const { pop, href, anchor } = state;

  // place it beside the booking, inside the calendar area and the visible screen
  useLayoutEffect(() => {
    const el = box.current!;
    const place = () => {
      const hr = host.getBoundingClientRect(), er = anchor.getBoundingClientRect();
      const h = el.offsetHeight;
      let left: number, top: number, width = W, side: "left" | "right" | "below";
      if (hr.width < 640) { // phones: full width, under the booking
        width = hr.width; left = 0; top = er.bottom - hr.top + GAP; side = "below";
      } else if (hr.right - er.right >= W + GAP) { left = er.right - hr.left + GAP; top = er.top - hr.top; side = "right"; }
      else if (er.left - hr.left >= W + GAP) { left = er.left - hr.left - W - GAP; top = er.top - hr.top; side = "left"; }
      else { left = Math.min(Math.max(0, er.left - hr.left), hr.width - W); top = er.bottom - hr.top + GAP; side = "below"; }
      if (side !== "below") {
        const viewBottom = window.innerHeight - hr.top - 12, viewTop = -hr.top + 80; // keep clear of the sticky header
        top = Math.max(Math.min(top, viewBottom - h), viewTop, 0);
      }
      Object.assign(el.style, { left: `${left}px`, top: `${top}px`, width: `${width}px` });
      return side;
    };
    const side = place();
    el.focus({ preventScroll: true });
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tw = still ? null : gsap.fromTo(el, { autoAlpha: 0, scale: 0.96, transformOrigin: side === "right" ? "0 0" : side === "left" ? "100% 0" : "50% 0" },
      { autoAlpha: 1, scale: 1, duration: 0.14, ease: "power2.out", clearProps: "transform,opacity,visibility" });
    return () => { tw?.kill(); };
  }, [state, host, anchor]);

  // close: Esc, a press outside the card (pressing another booking opens that one instead), a resize
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(true); };
    const down = (e: PointerEvent) => {
      const t = e.target as Element;
      if (box.current?.contains(t) || t.closest?.(".fc-event, .fc-list-event")) return;
      onClose(false);
    };
    const resize = () => onClose(false);
    window.addEventListener("keydown", key);
    document.addEventListener("pointerdown", down, true);
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("keydown", key); document.removeEventListener("pointerdown", down, true); window.removeEventListener("resize", resize); };
  }, [onClose]);

  return (
    <div ref={box} className="cal-pop" role="dialog" aria-label={`${pop.title} details`} tabIndex={-1} style={{ "--pc": `var(--c-${pop.courtId}, var(--accent))` } as React.CSSProperties}>
      <div className="cal-pop-head">
        <span className="cal-pop-dot" aria-hidden="true" />
        <div className="cal-pop-t">
          <h3>{pop.title}</h3>
          <p>{pop.sub} · <span className="cal-pop-st">{pop.status}</span></p>
        </div>
        <button type="button" className="cal-pop-x" aria-label="Close" onClick={() => onClose(true)}>×</button>
      </div>
      <p className="cal-pop-when">{pop.when}</p>
      <dl className="cal-pop-rows">
        {pop.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <div className="row cal-pop-acts">
        <button type="button" className="btn btn-lime btn-sm" onClick={() => onOpen(href)}>{pop.kind === "booking" ? "Open booking" : "Open class"}</button>
      </div>
    </div>
  );
}
