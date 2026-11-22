"use client";
import { useRef } from "react";
import { gsap } from "gsap";
import { Arrow } from "@/components/art";
import { expandClose, expandOpen } from "@/lib/gsap/expand";

/* "Past & cancelled (n)" on Registration Controls (spec §7, v5.88): still a plain <details> (works without JavaScript and for
   screen readers), with an animated expand / collapse (expand.ts) and an arrow that flips. A click mid-animation turns it
   around from where it is. Reduced motion: opens and closes instantly. */
export default function PastDetails({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const d = useRef<HTMLDetailsElement>(null), body = useRef<HTMLDivElement>(null), arrow = useRef<HTMLSpanElement>(null);
  const closing = useRef(false);
  const anim = useRef<gsap.core.Timeline | null>(null); // the running open / close, stopped whole when interrupted
  const toggle = (e: React.MouseEvent) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    const el = d.current!, b = body.current!;
    anim.current?.kill(); // a close cut short must not still close it at its end
    if (el.open && !closing.current) {
      closing.current = true;
      anim.current = expandClose(b, arrow.current, () => { closing.current = false; el.open = false; gsap.set([b], { clearProps: "height,opacity,visibility,overflow" }); });
    } else {
      const from = closing.current ? b.getBoundingClientRect().height : undefined; // reopened mid-close: grow from where it is
      closing.current = false;
      el.open = true;
      anim.current = expandOpen(b, arrow.current, from);
    }
  };
  return (
    <details ref={d} className="stack past">
      <summary onClick={toggle}>{label}<span ref={arrow} className="past-arrow" aria-hidden="true"><Arrow dir="d" /></span></summary>
      <div ref={body} className="past-body"><div style={{ paddingTop: 10 }}>{children}</div></div>
    </details>
  );
}
