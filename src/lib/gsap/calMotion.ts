import { gsap } from "gsap";

/* Admin Calendar motion (spec §4 / §7, v6.00). Off with reduced motion (callers check `still()`).
   v6.08 dropped the first-display entrance (the calendar replaces its skeleton); v6.09 dropped the loading shade and the bookings'
   fade-up (the skeleton is the only loading state; bookings just appear).
   - calSwap: the calendar body (and its title) after Month / Week / Day / List, ◀ ▶ arrows, Today or a court filter change.
     "prev" slides in from the left, "next" from the right, "view" / "filter" rise in.
   v6.12 dropped the booking hover / press motion (v6.07): clicking a booking opens its details card instead. */
const CLEAR = "transform,opacity,visibility";
export const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;


export type SwapKind = "prev" | "next" | "view" | "filter";
export function calSwap(wrap: HTMLElement, kind: SwapKind) {
  const body = wrap.querySelector<HTMLElement>(".fc-view-harness");
  const title = wrap.querySelector<HTMLElement>(".fc-toolbar-title");
  const from = kind === "prev" ? { x: -40, y: 0 } : kind === "next" ? { x: 40, y: 0 } : { x: 0, y: 18 };
  if (body) {
    gsap.killTweensOf(body);
    gsap.fromTo(body, { autoAlpha: 0, ...from }, { autoAlpha: 1, x: 0, y: 0, duration: kind === "filter" ? 0.45 : 0.55, ease: "power3.out", clearProps: CLEAR });
  }
  if (title && kind !== "filter") {
    gsap.killTweensOf(title);
    gsap.fromTo(title, { autoAlpha: 0, x: from.x / 2, y: from.y / 2 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.45, ease: "power3.out", clearProps: CLEAR });
  }
}
