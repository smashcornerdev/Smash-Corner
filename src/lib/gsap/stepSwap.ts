import { gsap } from "gsap";

/** Book page step change (spec §6, v5.33): the new step's panel slides in and fades in, from the right when moving forward
 *  and from the left when going back. Call it right after the new step is in the DOM (before paint). Off with reduced motion. */
export function stepSwap(panel: Element | null, dir: 1 | -1) {
  if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const tw = gsap.fromTo(panel, { autoAlpha: 0, x: 48 * dir }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "expo.out", clearProps: "transform,opacity,visibility" });
  return () => { tw.kill(); gsap.set(panel, { clearProps: "transform,opacity,visibility" }); };
}

/** Step 3 "Time slot N" entry (v5.33): when a time slot is added (or grows by merging with a new pick) its card drops in and
 *  fades in. Off with reduced motion. */
export function slotIn(els: Element[]) {
  if (!els.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.fromTo(els, { autoAlpha: 0, y: -14, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out", clearProps: "transform,opacity,visibility" });
}

/** Removing a "Time slot N" card (v5.33): it fades out sliding right while it folds shut (the cards below close the gap), then
 *  `done` takes it out of the list. Straight away with reduced motion. */
export function slotOut(el: HTMLElement | null, done: () => void) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
  el.style.pointerEvents = "none";
  el.style.overflow = "hidden";
  gsap.timeline({ onComplete: done })
    .to(el, { autoAlpha: 0, x: 32, duration: 0.25, ease: "power2.in" })
    .to(el, { height: 0, paddingTop: 0, paddingBottom: 0, borderTopWidth: 0, borderBottomWidth: 0, marginBottom: -8, duration: 0.3, ease: "power3.inOut" }); // -8: the list's gap
}

/** Step 3 hint card ("1 Click your start time" → "2 Start: … Now click your end time" → …, v5.36): the card stays, its new
 *  content slides in from the left and fades in, the step number pops in, and the card's height follows smoothly if it changed
 *  (`fromH`: its height before). Off with reduced motion. */
export function hintSwap(card: HTMLElement | null, fromH: number) {
  if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const inner = card.firstElementChild, num = card.querySelector(".tp-step"), toH = card.offsetHeight;
  if (fromH && Math.abs(toH - fromH) > 1) gsap.fromTo(card, { height: fromH }, { height: toH, duration: 0.4, ease: "power3.out", clearProps: "height" });
  if (inner) gsap.fromTo(inner, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: "expo.out", clearProps: "opacity,visibility,transform" });
  if (num) gsap.fromTo(num, { scale: 0.5 }, { scale: 1, duration: 0.5, ease: "expo.out", clearProps: "transform" });
}

/** Step 4 equipment list, shown when "Rent equipment?" is set to Yes (v5.37): the list unfolds, and the items rise in and fade
 *  in one by one, top first. Off with reduced motion. */
export function listReveal(list: HTMLElement | null) {
  if (!list || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const h = list.offsetHeight, rows = Array.from(list.children);
  const tl = gsap.timeline()
    .fromTo(list, { height: 0, overflow: "hidden" }, { height: h, duration: 0.45, ease: "power3.out", clearProps: "height,overflow" }, 0)
    .fromTo(rows, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.09, ease: "expo.out", clearProps: "opacity,visibility,transform" }, 0.05);
  return () => { tl.kill(); gsap.set([list, ...rows], { clearProps: "height,overflow,opacity,visibility,transform" }); };
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A button that just became clickable (Step 3 Continue, v5.38): it settles from slightly smaller with a short brightness flash
 *  as it turns lime, so the eye goes to it. Off with reduced motion. */
export function btnLit(btn: HTMLElement | null) {
  if (!btn || reduced()) return;
  gsap.fromTo(btn, { scale: 0.92, filter: "brightness(1.45)" }, { scale: 1, filter: "brightness(1)", duration: 0.6, ease: "expo.out", clearProps: "transform,filter" });
}

/** A button that just appeared (Step 3 "+ Add time slot" / Cancel, v5.38): slides in from the left and fades in. */
export function btnIn(btn: HTMLElement | null) {
  if (!btn || reduced()) return;
  // CSS `translate`, not `transform`: the new button often appears under the pointer, and `.btn:hover` forces transform:none
  gsap.fromTo(btn, { autoAlpha: 0, translate: "-24px 0px" }, { autoAlpha: 1, translate: "0px 0px", duration: 0.55, ease: "expo.out", clearProps: "translate,opacity,visibility" });
}

export type BtnLook = { backgroundColor: string; color: string };
/** what a button looks like right now (to animate away from it after it changes) */
export const btnLook = (btn: HTMLElement | null): BtnLook | null => {
  if (!btn) return null;
  const c = getComputedStyle(btn);
  return { backgroundColor: c.backgroundColor, color: c.color };
};

/** A button that just became unavailable (Step 3 Continue / "+ Add time slot" after the last time slot is removed, v5.39): its
 *  colours fade from how it looked (`from`) to the shaded disabled look while it settles back slightly, instead of switching
 *  at once. Off with reduced motion. */
export function btnDim(btn: HTMLElement | null, from: BtnLook | null) {
  if (!btn || !from || reduced()) return;
  const to = btnLook(btn)!;
  gsap.fromTo(btn, { ...from, scale: 1.04 }, { ...to, scale: 1, duration: 0.5, ease: "power2.out", clearProps: "backgroundColor,color,transform" });
}
