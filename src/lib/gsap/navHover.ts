import { gsap } from "gsap";

/** Header motion (spec §4, v5.49). Returns a cleanup. Off with reduced motion.
 *  - Desktop nav tabs (mouse, wider than 1100 px): one hover pill glides from tab to tab under the pointer (stretching to each
 *    tab's width), fades/grows in when the pointer enters the nav and fades out when it leaves.
 *  - Pressing a tab (any pointer, phone menu too): the tab dips slightly (to 95%), then settles back with a small overshoot (v5.51).
 *  - Shopping-bag button (header and phone menu): on hover the bag lifts and swings on its handle; on press it squashes a little and
 *    settles back with a small overshoot, and the count badge pops slightly (v5.51). */
export function navHover(nav: HTMLElement, pill: HTMLElement, bags: HTMLElement[]) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const desktop = () => window.matchMedia("(hover: hover) and (min-width: 1101px)").matches;
  const links = Array.from(nav.querySelectorAll<HTMLElement>(":scope > a"));
  const offs: (() => void)[] = [];
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn);
    offs.push(() => el.removeEventListener(type, fn));
  };
  nav.classList.add("has-pill"); // CSS: tabs drop their own hover background, the pill draws it instead
  let pillOn = false;
  const box = (a: HTMLElement) => ({ x: a.offsetLeft, y: a.offsetTop, width: a.offsetWidth, height: a.offsetHeight });

  links.forEach((a) => {
    on(a, "pointerenter", (e) => {
      if (e.pointerType !== "mouse" || !desktop()) return;
      if (!pillOn) { // appear in place, growing out slightly
        pillOn = true;
        gsap.set(pill, box(a));
        gsap.fromTo(pill, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: "power3.out", overwrite: "auto" });
      } else {
        gsap.to(pill, { ...box(a), autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out", overwrite: "auto" });
      }
    });
    // press: squash, then spring back on release (or when the pointer slides off)
    on(a, "pointerdown", () => gsap.to(a, { scale: 0.95, duration: 0.1, ease: "power2.out", overwrite: "auto" }));
    const release = () => gsap.to(a, { scale: 1, duration: 0.3, ease: "back.out(1.6)", overwrite: "auto", clearProps: "scale" });
    on(a, "pointerup", release);
    on(a, "pointerleave", () => { if (gsap.getProperty(a, "scale") !== 1) release(); });
  });
  on(nav, "pointerleave", () => {
    if (!pillOn) return;
    pillOn = false;
    gsap.to(pill, { autoAlpha: 0, scale: 0.9, duration: 0.25, ease: "power2.out", overwrite: "auto" });
  });

  bags.forEach((b) => {
    const svg = b.querySelector("svg");
    if (!svg) return;
    gsap.set(svg, { transformOrigin: "50% 15%" }); // swings from the handle
    on(b, "pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      gsap.timeline({ defaults: { overwrite: "auto" } })
        .to(svg, { y: -2, duration: 0.2, ease: "power2.out" }, 0)
        .to(svg, { keyframes: { rotation: [-14, 10, -6, 3, 0] }, duration: 0.7, ease: "sine.inOut" }, 0);
    });
    on(b, "pointerleave", () => gsap.to(svg, { y: 0, rotation: 0, scaleX: 1, scaleY: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" }));
    on(b, "pointerdown", () => gsap.to(svg, { scaleX: 1.08, scaleY: 0.9, y: 1, duration: 0.1, ease: "power2.out", overwrite: "auto" }));
    on(b, "pointerup", () => {
      gsap.to(svg, { scaleX: 1, scaleY: 1, y: 0, rotation: 0, duration: 0.3, ease: "back.out(1.6)", overwrite: "auto" });
      const count = b.querySelector(".cart-count");
      if (count) gsap.fromTo(count, { scale: 1.2 }, { scale: 1, duration: 0.3, ease: "power2.out", clearProps: "scale" });
    });
  });

  return () => {
    offs.forEach((f) => f());
    nav.classList.remove("has-pill");
    gsap.killTweensOf([pill, ...links, ...bags.map((b) => b.querySelector("svg"))]);
    gsap.set([pill, ...links], { clearProps: "all" });
  };
}
