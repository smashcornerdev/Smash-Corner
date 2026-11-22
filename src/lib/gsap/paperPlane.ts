import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);

/* Contact form "paper plane" send (spec §2 Contact, v5.45). Our own GSAP take on the idea: the message is printed on a sheet
   over the Message field, the sheet folds into a paper plane, and the plane flies in an arc into the Send button. The caller
   then swaps the form for the receipt and calls receiptOpen(), which opens the receipt out of the button. */

// the sheet's outline as 5 points, rectangle → paper-plane side view (TL → tail top, TR + BR → nose, BL → tail bottom,
// left middle → the fold notch), so clip-path can morph between them
const SHEET = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%)";
const PLANE = "polygon(0% 8%, 100% 50%, 100% 50%, 0% 92%, 30% 56%)";

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Plays print → fold → fly inside `card` (position: relative), from over `field` into `button`; `done` runs once the plane
 *  is in the button. Returns a cleanup. */
export function paperPlaneSend({ card, field, button, text, done }: { card: HTMLElement; field: HTMLElement; button: HTMLElement; text: string; done: () => void }) {
  const c = card.getBoundingClientRect(), f = field.getBoundingClientRect(), b = button.getBoundingClientRect();
  const sheet = document.createElement("div");
  sheet.className = "pp-sheet";
  sheet.setAttribute("aria-hidden", "true");
  const ink = document.createElement("p");
  ink.className = "pp-ink";
  ink.textContent = text.length > 280 ? text.slice(0, 277) + "…" : text;
  const crease = document.createElement("i");
  crease.className = "pp-crease";
  sheet.append(ink, crease);
  Object.assign(sheet.style, { left: `${f.left - c.left}px`, top: `${f.top - c.top}px`, width: `${f.width}px`, height: `${f.height}px` });
  card.appendChild(sheet);

  const PW = 64, PH = 40; // plane size
  // centre of the sheet (it folds in place) → a small pull back → an arc up and over → into the button
  const sx = f.left - c.left + f.width / 2, sy = f.top - c.top + f.height / 2;
  const bx = b.left - c.left + b.width / 2, by = b.top - c.top + b.height / 2;
  const up = Math.min(sy, by) - 90;

  const tl = gsap.timeline({ onComplete: () => { sheet.remove(); done(); } });
  tl.fromTo(sheet, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out" })
    // print: the text comes in from the top down, a few lines at a time like a printer
    .fromTo(ink, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "steps(8)" }, 0.15)
    // fold: the ink goes, a crease shows, the outline turns into a plane while the sheet shrinks around its centre
    .to(ink, { autoAlpha: 0, duration: 0.2 }, 1.05)
    .fromTo(crease, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 1.1)
    .fromTo(sheet, { clipPath: SHEET }, {
      clipPath: PLANE, left: sx - PW / 2, top: sy - PH / 2, width: PW, height: PH, rotation: -12,
      duration: 0.65, ease: "power3.inOut",
    }, 1.05)
    // fly: a small pull back, then an arc up and down into the button, nose first
    .to(sheet, {
      motionPath: {
        path: [
          { left: sx - PW / 2 - 24, top: sy - PH / 2 + 10 },
          { left: (sx + bx) / 2 + 40 - PW / 2, top: up - PH / 2 },
          { left: bx - PW / 2, top: by - PH / 2 },
        ],
        curviness: 1.4, autoRotate: true,
      },
      duration: 1.05, ease: "power2.inOut",
    }, 1.75)
    .to(sheet, { scale: 0.35, autoAlpha: 0, duration: 0.25, ease: "power2.in" }, 2.6)
    // the button takes the hit
    .fromTo(button, { scale: 1 }, { scale: 0.94, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out", clearProps: "transform" }, 2.7);
  return () => { tl.kill(); sheet.remove(); };
}

/** The receipt opens out of the Send button's box (`from`, relative to the card) to the whole card, the card's height easing
 *  from the form's (`fromH`) to the receipt's, then its contents rise in one by one. */
export function receiptOpen(card: HTMLElement, receipt: HTMLElement, from: { top: number; left: number; width: number; height: number }, fromH: number) {
  if (reducedMotion()) return;
  const toH = card.offsetHeight, w = card.offsetWidth;
  // clip-path on the card itself (its box is the reference), from the button's box to the full card
  const inset = (t: number, l: number, wd: number, h: number, H: number) => `inset(${t}px ${w - l - wd}px ${Math.max(0, H - t - h)}px ${l}px round 12px)`;
  gsap.timeline()
    .fromTo(card, { height: fromH, clipPath: inset(from.top, from.left, from.width, from.height, fromH) },
      { height: toH, clipPath: inset(0, 0, w, toH, toH), duration: 0.6, ease: "power3.inOut", clearProps: "height,clipPath" }, 0)
    .fromTo(receipt.children, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "expo.out", clearProps: "opacity,visibility,transform" }, 0.3);
}
