import { gsap } from "gsap";

const CLEAR = "transform,opacity,visibility,clipPath";

/** Phone menu opening (0.8 s in all): the full-screen panel comes down from the top, then the links (and Cart / Book) fade in one after another. */
export function menuIn(nav: HTMLElement) {
  const links = nav.querySelectorAll(":scope > *");
  gsap.killTweensOf([nav, links]);
  return gsap.timeline({ defaults: { clearProps: CLEAR } })
    .fromTo(nav, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.45, ease: "power3.inOut" }, 0)
    .fromTo(links, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }, 0.3);
}

/** Phone menu closing: the panel rolls back up (quicker than it opened); `done` then hides it (synchronously, e.g. via flushSync). */
export function menuOut(nav: HTMLElement, done: () => void) {
  const links = nav.querySelectorAll(":scope > *");
  gsap.killTweensOf([nav, links]);
  // hide first (done must hide synchronously), then clear: clearing first shows the full panel for a frame
  return gsap.timeline({ onComplete: () => { done(); gsap.set([nav, links], { clearProps: CLEAR }); } })
    .to(links, { autoAlpha: 0, duration: 0.15, ease: "power1.in" }, 0)
    .fromTo(nav, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.3, ease: "power2.in" }, 0.05);
}
