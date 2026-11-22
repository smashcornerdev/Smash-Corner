import { gsap } from "gsap";

/** Download button hover (spec §4 / §7, v5.77): the ⤓ arrow dips down and back, over and over, while the pointer is on the
 *  button; on leave it settles back in place. Returns the stop function to call on leave. */
export function arrowDip(arrow: HTMLElement) {
  gsap.killTweensOf(arrow);
  const tw = gsap.fromTo(arrow, { y: 0 }, { y: 4, duration: 0.38, ease: "sine.inOut", yoyo: true, repeat: -1 });
  return () => { tw.kill(); gsap.to(arrow, { y: 0, duration: 0.2, ease: "power2.out", clearProps: "transform" }); };
}
