"use client";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useLayoutEffect, useRef, type RefObject } from "react";

gsap.registerPlugin(ScrollToPlugin);

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Sliding highlight for an in-page tab row (Gallery tabs, Programs & Events tabs; spec §4 v5.56–v5.58). The pill copies the
 *  `.on` tab's layout box (offset*, not getBoundingClientRect: the page entrance slides the tabs in). It glides (0.45 s) whenever
 *  `active` changes and follows resizes without animating. Optional `.tab-slot` spans in the row get each tab's box too. One ResizeObserver for the row's life: re-creating it on every change
 *  fired its initial callback mid-slide, snapping the pill to the end before the tween pulled it back (the v5.57 double bounce). */
export function useTabPill(list: RefObject<HTMLElement | null>, pill: RefObject<HTMLElement | null>, active: string) {
  const placed = useRef(false);
  const box = (t: HTMLElement) => ({ x: t.offsetLeft, y: t.offsetTop, width: t.offsetWidth, height: t.offsetHeight });
  const place = (animate: boolean) => {
    const l = list.current, p = pill.current, on = l?.querySelector<HTMLElement>(":scope > .on");
    if (!l || !p || !on) return;
    // optional `.tab-slot` spans: each tab's own (inactive) background, drawn as a real element under the pill so no tab has to
    // paint behind itself (iOS Safari drew a button's z-index:-1 ::before over the pill, hiding it; v5.60)
    const slots = l.querySelectorAll<HTMLElement>(":scope > .tab-slot");
    if (slots.length) l.querySelectorAll<HTMLElement>(":scope > :is(button, a)").forEach((t, i) => slots[i] && gsap.set(slots[i], box(t)));
    const to = box(on);
    // only ever touch the pill's box: the page entrance fades it in (opacity/visibility) at the same time, and killing that fade
    // (killTweensOf(p) / overwrite: true did) left it invisible for good. iOS resizes the row mid-entrance (toolbars, fonts), so
    // on iPhones the Gallery highlight never appeared (v5.61 fix)
    if (animate && !still()) gsap.to(p, { ...to, duration: 0.45, ease: "power3.out", overwrite: "auto" });
    else { gsap.killTweensOf(p, "x,y,width,height"); gsap.set(p, to); }
  };
  useLayoutEffect(() => {
    place(placed.current);
    placed.current = true;
    list.current?.classList.add("ready");
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => place(false));
    ro.observe(list.current!);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Glides the page so `el`'s top lands `offsetY` px below the top of the screen (0.8 s); touching, wheeling or pressing a scroll
 *  key mid-glide stops it so the visitor takes over. The highlight isn't set here: the page's scroll-spy moves it as each section
 *  passes, so it travels with the glide.
 *  Not ScrollToPlugin's autoKill (v5.59 fix): it stops the tween whenever the scroll position isn't exactly what it last set, and
 *  iOS Safari (fractional scroll positions, the address bar shrinking as the page scrolls) trips that a few frames in, so on
 *  iPhones the glide moved a little and stopped. */
let stopGlide: (() => void) | null = null;
export function glideTo(el: HTMLElement, offsetY: number) {
  if (still()) { window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - offsetY); return; }
  stopGlide?.();
  const INPUT = ["touchstart", "wheel", "keydown"] as const;
  const done = () => { INPUT.forEach((t) => window.removeEventListener(t, cancel)); stopGlide = null; };
  const tween = gsap.to(window, { scrollTo: { y: el, offsetY, autoKill: false }, duration: 0.8, ease: "power3.inOut", overwrite: true,
    onComplete: done });
  const cancel = (e: Event) => {
    if (e.type === "keydown" && !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes((e as KeyboardEvent).key)) return;
    tween.kill(); done();
  };
  stopGlide = () => { tween.kill(); done(); };
  // listen from the next frame: the tap that started this glide must not cancel it
  requestAnimationFrame(() => { if (stopGlide) INPUT.forEach((t) => window.addEventListener(t, cancel, { passive: true })); });
}
