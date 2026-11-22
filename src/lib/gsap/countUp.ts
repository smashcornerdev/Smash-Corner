import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Counts el's text from `from` to `to` (2 s, power2.out) when it scrolls into view; format turns the running value into text,
// e.g. (v) => "₱" + Math.round(v).toLocaleString() for money (any size: ₱0 → ₱12,345,678) or (v) => v.toFixed(1) + "%".
// onUpdate gets the running value so a later count can start from where this one stopped. Returns a cleanup that kills the tween.
export function countUp(el: Element, to: number, format: (v: number) => string, { from = 0, duration = 2, ease = "power2.out", onUpdate }: {
  from?: number; duration?: number; ease?: string; onUpdate?: (v: number) => void;
} = {}) {
  const obj = { val: from };
  el.textContent = format(from);
  const tween = gsap.to(obj, {
    val: to, duration, ease,
    scrollTrigger: { trigger: el, once: true },
    onUpdate: () => { el.textContent = format(obj.val); onUpdate?.(obj.val); },
  });
  return () => { tween.scrollTrigger?.kill(); tween.kill(); };
}
