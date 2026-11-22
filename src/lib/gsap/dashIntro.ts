import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CLEAR = "transform,opacity,visibility";
// same as the public scroll reveals: play when the top of it comes into view near the bottom of the screen (see sectionReveal.ts
// for why it isn't `once: true`)
const ANY = { start: "top 88%", toggleActions: "play play play play" };

/** Admin Dashboard entrance (spec §4 / §7, v5.70):
 *  - the page title ("Dashboard") slides in from the right;
 *  - the stat cards come in from the top left one at a time in reading order: row 1 left to right, then row 2 left to right
 *    (DOM order of the grid; on desktop all 4 are one row);
 *  - each section ("Requests to review", "Payments to verify", "Today on court"): its header slides in from the right, then its
 *    content (the table, or the "nothing here" box) comes in from the top left. Sections below the fold play as they scroll into view.
 *  dashIntro() hides everything (call before paint) and returns `play` (call once the splash is gone). */
export function dashIntro(title: Element | null, scope: Element) {
  const q = gsap.utils.selector(scope);
  const cards = q(".stats > .stat");
  const secs = q(".dash-sec");
  const headOf = (s: Element) => s.querySelector(":scope > .dash-head");
  const bodyOf = (s: Element) => Array.from(s.children).filter((c) => !c.classList.contains("dash-head"));
  const ctx = gsap.context(() => {
    if (title) gsap.set(title, { autoAlpha: 0, x: 80 });
    if (cards.length) gsap.set(cards, { autoAlpha: 0, x: -60, y: -40 });
    secs.forEach((s) => {
      gsap.set(headOf(s), { autoAlpha: 0, x: 80 });
      gsap.set(bodyOf(s), { autoAlpha: 0, x: -60, y: -40 });
    });
  }, scope);
  const play = () => ctx.add(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1, clearProps: CLEAR } });
    if (title) tl.to(title, { autoAlpha: 1, x: 0 }, 0);
    if (cards.length) tl.to(cards, { autoAlpha: 1, x: 0, y: 0, duration: 0.8, stagger: 0.12 }, 0.15);
    secs.forEach((s) => {
      gsap.timeline({ scrollTrigger: { trigger: s, ...ANY }, defaults: { ease: "expo.out", duration: 1, clearProps: CLEAR }, delay: 0.3 })
        .to(headOf(s), { autoAlpha: 1, x: 0 }, 0)
        .to(bodyOf(s), { autoAlpha: 1, x: 0, y: 0 }, 0.2);
    });
  });
  return { play, revert: () => ctx.revert() };
}
