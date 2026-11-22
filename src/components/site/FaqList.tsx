"use client";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import type { MouseEvent } from "react";

gsap.registerPlugin(SplitText);

/* Contact FAQ accordion (spec §2; animated v5.27, v5.46): still plain <details>, so it works without JavaScript and for screen readers.
   Opening: the answer slides down from 0 height while its lines wipe in left to right, one after another (whole thing ≈0.45 s),
   and the chevron flips ▾→▴ with a small overshoot. Closing: the answer slides back up and fades (0.25 s), the chevron flips back,
   then the <details> closes. A click mid-animation reverses it. The chevron is GSAP-driven because the global no-animation rule
   in globals.css switches CSS transitions off. Reduced motion: opens and closes instantly. */
const splits = new WeakMap<Element, SplitText>();

export default function FaqList({ items }: { items: [string, string][] }) {
  const toggle = (e: MouseEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    const d = e.currentTarget.parentElement as HTMLDetailsElement;
    const a = d.querySelector(".faq-a")!, p = a.querySelector("p")!, chev = d.querySelector(".faq-chev")!;
    gsap.killTweensOf([a, chev]);
    const old = splits.get(p);
    if (old) { gsap.killTweensOf(old.lines); old.revert(); splits.delete(p); }
    const closing = d.open && d.dataset.state !== "closing";
    if (closing) {
      d.dataset.state = "closing";
      gsap.to(chev, { rotation: 45, y: -3, duration: 0.25, ease: "power2.inOut" });
      gsap.to(a, { height: 0, opacity: 0, duration: 0.25, ease: "power2.in",
        onComplete: () => { d.open = false; delete d.dataset.state; gsap.set(a, { clearProps: "height,opacity" }); } });
    } else {
      const reopening = d.dataset.state === "closing"; // clicked again mid-close: carry on from where it is
      delete d.dataset.state;
      d.open = true;
      gsap.to(chev, { rotation: -135, y: 2, duration: 0.3, ease: "back.out(2)" });
      const to = { height: "auto", opacity: 1, duration: 0.3, ease: "power3.out", clearProps: "height,opacity" };
      if (reopening) gsap.to(a, to);
      else gsap.fromTo(a, { height: 0, opacity: 0 }, to);
      // Lines wipe in left to right, staggered; the stagger shrinks for long answers so the total stays ≈0.45 s.
      const split = new SplitText(p, { type: "lines", linesClass: "faq-line" });
      splits.set(p, split);
      const n = split.lines.length;
      gsap.fromTo(split.lines,
        { clipPath: "inset(0 100% 0 0)", x: -10, opacity: 0 },
        { clipPath: "inset(0 0% 0 0)", x: 0, opacity: 1, duration: 0.25, ease: "power2.out",
          stagger: n > 1 ? Math.min(0.07, 0.2 / (n - 1)) : 0, delay: 0.05,
          onComplete: () => { split.revert(); splits.delete(p); } });
    }
  };
  return (
    <div className="stack" style={{ gap: 8, maxWidth: 860 }}>
      {items.map(([q, a]) => (
        <details className="card faq" style={{ padding: 0 }} key={q}>
          <summary onClick={toggle}>{q}<span className="faq-chev" aria-hidden="true" /></summary>
          <div className="faq-a"><p className="muted">{a}</p></div>
        </details>
      ))}
    </div>
  );
}
