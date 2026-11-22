import { gsap } from "gsap";

const CLEAR = "height,opacity,visibility,transform,overflow";

/** Registration Controls → "Past & cancelled" (spec §4 / §7, v5.88). Opening: the section grows from nothing to its height and
 *  fades in, the arrow flips, then the table comes in from the top left and its rows fade up one after another (≈0.8 s). */
export function expandOpen(body: HTMLElement, arrow: HTMLElement | null, from?: number) {
  const block = body.querySelector<HTMLElement>(".tbl-block, .empty");
  const rows = Array.from(body.querySelectorAll<HTMLElement>("tbody > tr"));
  gsap.killTweensOf([body, arrow, block, ...rows].filter(Boolean));
  const tl = gsap.timeline({ defaults: { clearProps: CLEAR } });
  tl.fromTo(body, { height: from ?? 0, autoAlpha: from == null ? 0 : 1, overflow: "hidden" }, { height: "auto", autoAlpha: 1, duration: 0.4, ease: "power3.out" }, 0);
  if (arrow) tl.to(arrow, { rotation: 180, duration: 0.35, ease: "back.out(2)", clearProps: "" }, 0); // stays flipped while open
  if (block) tl.fromTo(block, { autoAlpha: 0, x: -40, y: -24 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.6, ease: "expo.out" }, 0.08);
  if (rows.length) tl.fromTo(rows, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" }, 0.25);
  return tl;
}

/** Closing: the section fades and shrinks back to nothing and the arrow flips back (≈0.3 s); `done` then closes it. */
export function expandClose(body: HTMLElement, arrow: HTMLElement | null, done: () => void) {
  gsap.killTweensOf([body, arrow].filter(Boolean));
  const tl = gsap.timeline({ onComplete: done });
  tl.to(body, { height: 0, autoAlpha: 0, overflow: "hidden", duration: 0.28, ease: "power2.in" }, 0);
  if (arrow) tl.to(arrow, { rotation: 0, duration: 0.28, ease: "power2.inOut" }, 0);
  return tl;
}
