import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Grows each `.bar-fill` to its percentage, one after another, when `.chart` scrolls into view.
// data is an array of percentages (0–100), one per bar, in DOM order.
// scope limits the selectors to one chart; duration is per bar; stagger 0 grows every bar at once. Returns a cleanup that kills the tween and its ScrollTrigger.
export function barChartGrow(data: number[], scope?: Element | null, { duration = 0.8, stagger = 0.1, ease = "power2.out" }: { duration?: number; stagger?: number; ease?: string } = {}) {
  const ctx = gsap.context(() => {
    gsap.fromTo(".bar-fill", { height: 0 }, {
      height: (i: number) => data[i] + "%",
      duration, stagger,
      ease,
      scrollTrigger: scope ?? ".chart",
    });
  }, scope ?? undefined);
  return () => ctx.revert();
}
