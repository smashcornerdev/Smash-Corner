import { gsap } from "gsap";

// the page's sub tabs under the top: Programs & Events jump buttons, Book tabs, Gallery section tabs
const TABS = ".chips > .chip, .mode-sw > button, .gal-list > button";

/** Entrance for the top of every public page except Home (spec §4), in the same style as the section headings: the eyebrow and
 *  the title slide in from the left one after the other, the lead slides in from the right (v5.33), then the page's sub tabs
 *  appear one by one, left first (v5.33). pageIntro() sets the start state (call it while the splash still covers the page, or
 *  before paint on client navigation) and returns `play`. `scope` is where to look for the sub tabs (the page's main). */
export function pageIntro(top: Element, scope: Element = top) {
  const q = gsap.utils.selector(top);
  // only the tabs actually shown
  const tabs = gsap.utils.toArray<HTMLElement>(TABS, scope).filter((t) => t.getClientRects().length > 0);
  // the Book, Gallery and Programs & Events tabs' sliding pills (v5.35, v5.56, v5.58) only fade in, with its tab: its x/y are its position, so it isn't moved or cleared
  // (and the Gallery's grey .tab-slot backgrounds, v5.60, each with its own tab)
  const pills = gsap.utils.toArray<HTMLElement>(".mode-sw-pill, .gal-pill, .pe-pill, .tab-slot", scope);
  const tabOf = (p: HTMLElement) => p.classList.contains("tab-slot")
    ? p.parentElement?.querySelectorAll<HTMLElement>(":scope > :is(button, a)")[[...p.parentElement.querySelectorAll(":scope > .tab-slot")].indexOf(p)]
    : p.parentElement?.querySelector<HTMLElement>(":scope > .on");
  const pillAt = (p: HTMLElement) => 0.4 + 0.1 * Math.max(0, tabs.indexOf(tabOf(p) as HTMLElement));
  const ctx = gsap.context(() => {
    gsap.set([...q(".eyebrow"), ...q("h1 .ln")], { autoAlpha: 0, x: -80 });
    if (q(".lead").length) gsap.set(q(".lead"), { autoAlpha: 0, x: 80 }); // the paragraph comes in from the right (v5.28)
    if (tabs.length) gsap.set(tabs, { autoAlpha: 0, x: -40 });
    if (pills.length) gsap.set(pills, { autoAlpha: 0 });
  }, top);
  const play = () => ctx.add(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1, clearProps: "transform,opacity,visibility" } })
      .to([...q(".eyebrow"), ...q("h1 .ln")], { autoAlpha: 1, x: 0, stagger: 0.12 }, 0);
    // empty target lists are skipped (GSAP warns "target not found" on them): not every page has a lead or sub tabs
    if (q(".lead").length) tl.to(q(".lead"), { autoAlpha: 1, x: 0 }, 0.2);
    if (tabs.length) tl.to(tabs, { autoAlpha: 1, x: 0, duration: 0.8, stagger: 0.1 }, 0.4);
    pills.forEach((p) => gsap.to(p, { autoAlpha: 1, duration: 0.8, delay: pillAt(p), ease: "expo.out", clearProps: "opacity,visibility" }));
  });
  return { play, revert: () => ctx.revert() };
}
