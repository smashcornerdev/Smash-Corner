import { gsap } from "gsap";

/** Reports Custom date boxes opening (spec §19, v6.17): the row slides open, pushing the report down smoothly, while
 *  From, To and Apply fade up one after another (about 0.5 s). The negative margin also eases in the page's gap above the row. */
export function customRangeIn(form: HTMLElement) {
  const gap = parseFloat(getComputedStyle(form.parentElement!).rowGap) || 0;
  gsap.set(form, { overflow: "hidden" });
  return gsap.timeline()
    .from(form, { height: 0, marginTop: -gap, duration: 0.35, ease: "power3.out", clearProps: "height,marginTop,overflow" }, 0)
    .from(form.querySelectorAll(":scope > *"), { autoAlpha: 0, y: 12, duration: 0.3, stagger: 0.07, ease: "power2.out", clearProps: "transform,opacity,visibility" }, 0.05);
}
