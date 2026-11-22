import { gsap } from "gsap";

// Booking summary motion (spec §6, v5.34). Everything is skipped with reduced motion.
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const GAP = 12; // the summary's row gap, folded away together with a row

/** A row that was just added unfolds and fades in, sliding in a little from the left. */
export function lineIn(els: HTMLElement[]) {
  if (!els.length || still()) return;
  els.forEach((el) => {
    const h = el.offsetHeight;
    gsap.fromTo(el, { height: 0, marginBottom: -GAP, autoAlpha: 0, x: -16, overflow: "hidden" },
      { height: h, marginBottom: 0, autoAlpha: 1, x: 0, duration: 0.5, ease: "expo.out", clearProps: "height,marginBottom,opacity,visibility,transform,overflow" });
  });
}

/** A row that was just removed fades out sliding right and folds shut, then `done` takes it out. */
export function lineOut(el: HTMLElement, done: () => void) {
  if (still()) return done();
  el.style.overflow = "hidden";
  gsap.timeline({ onComplete: done })
    .to(el, { autoAlpha: 0, x: 24, duration: 0.22, ease: "power2.in" })
    .to(el, { height: 0, marginBottom: -GAP, paddingTop: 0, borderTopWidth: 0, duration: 0.28, ease: "power3.inOut" });
}

/** A value that just changed (court, date, time, a price, the total) drops into place and fades in. */
export function valueIn(els: HTMLElement[]) {
  if (!els.length || still()) return;
  gsap.fromTo(els, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out", clearProps: "opacity,visibility,transform" });
}
