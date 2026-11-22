"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const NS = "http://www.w3.org/2000/svg";
const SEL = ".btn-lime, .btn-ghost, .btn-lav"; // the button designs that get the trace (lavender outline added v5.19)
// admin console (v5.72): only the buttons marked data-trace (View, Approve / Confirm payment, Reject)
const ADMIN_SEL = ".btn[data-trace]";

/** Outline of a `.btn` (cut top-left corner, rounded other corners), inset `i` px so the line reads as a frame just inside
 *  the edge (on the edge itself it would blend into the dark page). */
function outline(b: HTMLElement, i = 4) {
  const w = b.offsetWidth, h = b.offsetHeight, s = getComputedStyle(b);
  const cut = parseFloat(s.clipPath.match(/polygon\(\s*([\d.]+)px/)?.[1] ?? "0") + i * (Math.SQRT2 - 1); // diagonal moved in by i
  const r = Math.min(parseFloat(s.borderTopRightRadius) || 0, h / 2), a = Math.max(0, r - i);
  return `M${cut} ${i}H${w - r}A${a} ${a} 0 0 1 ${w - i} ${r}V${h - r}A${a} ${a} 0 0 1 ${w - r} ${h - i}`
    + `H${r}A${a} ${a} 0 0 1 ${i} ${h - r}V${cut}Z`;
}

/* Hover border trace (spec §4): every lime and lavender-outlined (ghost / lav) button on the public site gets an SVG outline that draws
   itself around the button on hover or keyboard focus (CSS in globals.css). Watches the page so buttons that appear later
   (booking steps, forms, or React re-rendering a button's text) get one too; reshapes when a button resizes. In the admin only on
   buttons marked data-trace (v5.72). */
export default function BorderTrace() {
  const path = usePathname();
  useEffect(() => {
    const sel = path.startsWith("/admin") ? ADMIN_SEL : SEL;
    const ro = new ResizeObserver((es) => es.forEach((e) => {
      const b = e.target as HTMLElement;
      b.querySelector(":scope > .trace-line path")?.setAttribute("d", outline(b));
    }));
    const seen = new WeakSet<HTMLElement>();
    const scan = () => document.querySelectorAll<HTMLElement>(sel).forEach((b) => {
      if (!b.classList.contains("btn")) return;
      if (!seen.has(b)) { seen.add(b); ro.observe(b); } // also reshapes the line once it's (re)added below
      if (b.querySelector(":scope > .trace-line")) return;
      const svg = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
      svg.setAttribute("class", "trace-line");
      svg.setAttribute("aria-hidden", "true");
      p.setAttribute("pathLength", "1");
      p.setAttribute("d", outline(b));
      svg.append(p);
      b.append(svg);
    });
    scan();
    let queued = 0;
    const mo = new MutationObserver(() => { if (!queued) queued = requestAnimationFrame(() => { queued = 0; scan(); }); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); ro.disconnect(); cancelAnimationFrame(queued); };
  }, [path]);
  return null;
}
