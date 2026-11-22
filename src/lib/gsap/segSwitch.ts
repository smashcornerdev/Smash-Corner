import { gsap } from "gsap";

/** Open registration → Rentals switch (spec §4 / §7, v5.86). The option just picked gives a small springy pop. */
export function segPop(el: HTMLElement) {
  gsap.killTweensOf(el);
  return gsap.fromTo(el, { scale: 0.93 }, { scale: 1, duration: 0.45, ease: "back.out(3)", clearProps: "transform" });
}

/** The rental fee / quantity fields open: they grow from nothing to their height while fading and sliding down a little. */
export function fieldsOpen(el: HTMLElement) {
  gsap.killTweensOf(el);
  return gsap.fromTo(el, { height: 0, autoAlpha: 0, y: -8, overflow: "hidden" },
    { height: "auto", autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out", clearProps: "height,opacity,visibility,transform,overflow" });
}

/** …and close: they fade and shrink to nothing (quicker); `done` then removes them (synchronously). */
export function fieldsClose(el: HTMLElement, done: () => void) {
  gsap.killTweensOf(el);
  return gsap.to(el, { height: 0, autoAlpha: 0, y: -8, overflow: "hidden", duration: 0.28, ease: "power2.in", onComplete: done });
}
