import { gsap } from "gsap";

// Odometer-style number roll: slides each vertical `.digit-strip` (0–9 stacked, one digit per window) to show its target digit.
// strips and digits are in the same order; each strip moves by yPercent (one digit = 10% of the strip), so no pixel heights are needed
// and it rolls on from wherever it stopped. Returns a cleanup that kills the tweens.
export function digitRoll(strips: Element[], digits: number[], { duration = 1.5, ease = "power2.out" }: { duration?: number; ease?: string } = {}) {
  const tweens = strips.map((s, i) => gsap.to(s, { yPercent: -digits[i] * 10, duration, ease }));
  return () => tweens.forEach((t) => t.kill());
}
