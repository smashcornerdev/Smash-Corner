import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const START = "top 88%"; // as soon as the top of it comes into view near the bottom of the screen
// Not `once: true`: a once-trigger whose spot is already scrolled past when it's created (e.g. reload with the scroll position
// restored) kills itself during creation and the tween then crashes reading it. Instead every state change just plays the
// animation (entering, or loading/jumping past it); replaying a finished one does nothing.
const ANY = { start: START, toggleActions: "play play play play" };

// what counts as a card: grid items, gallery photos, and stacked cards (events, FAQ) straight under a section heading
const CARDS = ".g2 > *, .g3 > *, .g4 > *, .teaser > *, .gal-grid > *, .sec-head + .stack > *";

/** Scroll reveals for the public pages (spec §4): each section heading slides in from the left, then the lime line under the
 *  title draws out left to right, and the intro paragraph under it comes in from the right; the cards rise in one at a time, left to right (cards that come into view together are
 *  staggered in reading order; on phones, where they stack, each one plays as it's reached); the "Ready to play?" band slides in.
 *  sectionReveal() hides everything (call it while the splash still covers the page) and returns `play`, which starts watching
 *  the scroll (call it once the splash is gone, so what's already on screen plays in view). Each part plays once. */
export function sectionReveal(scope: Element) {
  const q = gsap.utils.selector(scope);
  const heads = q(".sec-head, .gal-sh"), bands = q(".cta-band"), cards = q(CARDS);
  // from the left: the eyebrow + title (and the section's button); the intro paragraph comes in from the right (v5.28)
  const partsOf = (head: Element) => head.classList.contains("gal-sh") ? [head]
    : [...Array.from(head.querySelector(".stack")?.children ?? []).filter((c) => !c.matches(".lead")),
       ...Array.from(head.children).filter((c) => !c.classList.contains("stack"))];
  const leadOf = (head: Element) => head.querySelector(".stack > .lead") ?? [];
  const ctx = gsap.context(() => {
    heads.forEach((head) => { gsap.set(partsOf(head), { autoAlpha: 0, x: -80 }); gsap.set(leadOf(head), { autoAlpha: 0, x: 80 }); });
    gsap.set(q(".sec-head h2"), { "--ul": 0 });
    gsap.set(bands, { autoAlpha: 0, x: -80 });
    gsap.set(cards, { autoAlpha: 0, y: 40 });
  }, scope);
  const play = () => ctx.add(() => {
    heads.forEach((head) => {
      const h2 = head.matches(".sec-head") ? head.querySelector("h2") : null;
      gsap.timeline({ scrollTrigger: { trigger: head, ...ANY } })
        .to(partsOf(head), { autoAlpha: 1, x: 0, duration: 1, stagger: 0.12, ease: "expo.out", clearProps: "transform,opacity,visibility" })
        .to(leadOf(head), { autoAlpha: 1, x: 0, duration: 1, ease: "expo.out", clearProps: "transform,opacity,visibility" }, 0.2)
        .to(h2 ?? [], { "--ul": 1, duration: 0.7, ease: "power3.inOut", clearProps: "--ul" }, 0.35);
    });
    bands.forEach((b) => gsap.to(b, { autoAlpha: 1, x: 0, duration: 1, ease: "expo.out", clearProps: "transform,opacity,visibility", scrollTrigger: { trigger: b, ...ANY } }));
    const shown = new WeakSet<Element>();
    const reveal = (batch: Element[]) => {
      const fresh = batch.filter((c) => !shown.has(c));
      fresh.forEach((c) => shown.add(c));
      if (fresh.length) gsap.to(fresh, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "expo.out", clearProps: "transform,opacity,visibility" });
    };
    if (cards.length) ScrollTrigger.batch(cards, { start: START, onEnter: reveal, onLeave: reveal, onEnterBack: reveal }); // onLeave: loaded/jumped past
  });
  return { play, revert: () => ctx.revert() };
}
