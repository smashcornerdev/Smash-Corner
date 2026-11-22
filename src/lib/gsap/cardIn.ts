import { gsap } from "gsap";

const CLEAR = "transform,opacity,visibility";

/** Booking card opening (spec §4 / §7, v5.75; the Dashboard's "View"): the dark backdrop fades in, the card rises and grows
 *  slightly into place, then its parts (title, details, actions…) fade up one after another. About 0.7 s in all. */
export function cardIn(overlay: HTMLElement, card: HTMLElement) {
  const parts = card.querySelectorAll(":scope > *");
  gsap.killTweensOf([overlay, card, parts]);
  return gsap.timeline({ defaults: { clearProps: CLEAR } })
    .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "power1.out" }, 0)
    .fromTo(card, { autoAlpha: 0, y: 40, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }, 0.05)
    .fromTo(parts, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" }, 0.2);
}

/** Closing (v5.79; Export to Excel): the reverse, quicker than opening (about 0.3 s): the card's parts fade, the card sinks
 *  and shrinks slightly as it fades, and the backdrop fades out; `done` then removes it. */
export function cardOut(overlay: HTMLElement, card: HTMLElement, done: () => void) {
  const parts = card.querySelectorAll(":scope > *");
  gsap.killTweensOf([overlay, card, parts]);
  return gsap.timeline({ onComplete: done })
    .to(parts, { autoAlpha: 0, duration: 0.12, ease: "power1.in" }, 0)
    .to(card, { autoAlpha: 0, y: 24, scale: 0.97, duration: 0.25, ease: "power2.in" }, 0.03)
    .to(overlay, { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, 0.05);
}
