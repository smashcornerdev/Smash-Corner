import { gsap } from "gsap";

/** Sweeps a band of light across text styled with `.shine` (a gradient clipped to the text, parked just past the right edge).
 *  Plays once after `delay`; pass `every` (seconds) to repeat it. Kill the returned tween (or revert its gsap.context) to stop. */
export function textShine(el: Element, { delay = 0, duration = 2, every, ease = "power1.inOut" }: { delay?: number; duration?: number; every?: number; ease?: string } = {}) {
  return gsap.fromTo(el, { backgroundPosition: "100% 0" },
    { backgroundPosition: "0% 0", duration, ease, delay, ...(every != null && { repeat: -1, repeatDelay: every }) });
}
