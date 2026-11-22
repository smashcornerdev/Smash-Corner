import { gsap } from "gsap";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";

gsap.registerPlugin(Physics2DPlugin);

const COLORS = ["#bdf86c", "#d4d62a", "#b483d2", "#ffffff"]; // brand lime, chartreuse, lavender, white (spec §14)
const COUNT = 30;

/** One confetti piece: a small brand-coloured rectangle (some square, some strips) at the burst point, in a fixed layer. */
function createConfetti(layer: HTMLElement, x: number, y: number) {
  const piece = document.createElement("i");
  const w = gsap.utils.random(6, 11), h = Math.random() < 0.5 ? w : w * gsap.utils.random(1.8, 2.6);
  Object.assign(piece.style, {
    position: "absolute", left: `${x - w / 2}px`, top: `${y - h / 2}px`, width: `${w}px`, height: `${h}px`,
    background: gsap.utils.random(COLORS), borderRadius: Math.random() < 0.25 ? "50%" : "1px",
  });
  layer.appendChild(piece);
  return piece;
}

/** Confetti burst (spec §4, v5.42; on Send booking request since v5.43): 30 pieces fire upward from `from` (e.g. the button that was clicked) with
 *  Physics2DPlugin, spin, arc and fall under gravity, fading out near the end. They live in a fixed layer on <body> so they
 *  keep falling while the next page loads, and the layer removes itself when they're done. Nothing with reduced motion.
 *  (The working version of the stored stub confettiBurst.js, which can be deleted.) */
export function confettiBurst(from: Element) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = from.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "1000", overflow: "hidden" });
  document.body.appendChild(layer);
  const tl = gsap.timeline({ onComplete: () => layer.remove() });
  for (let i = 0; i < COUNT; i++) {
    const piece = createConfetti(layer, x + gsap.utils.random(-r.width / 3, r.width / 3), y);
    const life = gsap.utils.random(1.4, 2.1);
    tl.to(piece, {
      physics2D: { velocity: gsap.utils.random(300, 600), angle: gsap.utils.random(250, 290), gravity: 400 },
      rotation: gsap.utils.random(-540, 540), duration: life, ease: "none",
    }, 0)
      .to(piece, { autoAlpha: 0, duration: 0.4, ease: "power1.in" }, life - 0.4);
  }
}
