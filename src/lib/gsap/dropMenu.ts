import { gsap } from "gsap";

const CLEAR = "transform,opacity,visibility,clipPath";

/** Admin section tab dropdown on phones (spec §4 / §7, v5.82). Opening: the list unrolls downward from the button, then
 *  its tabs fade in one after another (about 0.45 s). */
export function dropIn(list: HTMLElement) {
  const items = list.querySelectorAll(":scope > *");
  gsap.killTweensOf([list, items]);
  return gsap.timeline({ defaults: { clearProps: CLEAR } })
    .fromTo(list, { clipPath: "inset(0% 0% 100% 0%)", y: -6 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.32, ease: "power3.out" }, 0)
    .fromTo(items, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.03, ease: "power2.out" }, 0.08);
}

/** Closing: the tabs fade and the list rolls back up into the button (quicker); `done` then hides it (synchronously). */
export function dropOut(list: HTMLElement, done: () => void) {
  const items = list.querySelectorAll(":scope > *");
  gsap.killTweensOf([list, items]);
  return gsap.timeline({ onComplete: () => { done(); gsap.set([list, items], { clearProps: CLEAR }); } })
    .to(items, { autoAlpha: 0, duration: 0.1, ease: "power1.in" }, 0)
    .fromTo(list, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.2, ease: "power2.in" }, 0.03);
}
