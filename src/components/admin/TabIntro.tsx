"use client";
import { useLayoutEffect, useRef } from "react";
import { afterSplash } from "@/lib/gsap/afterSplash";
import { tabIntro } from "@/lib/gsap/tabIntro";

/* Plays the tab entrance (spec §4 / §7; Court Bookings v5.78, Classes & Events v5.88) on the elements after it, each time a tab is opened
   (`tab` changes). Starts once the splash is gone (straight away when switching tabs); off with reduced motion. */
/** `notesOnly` (v5.99): only the note slides in from the left (Waitlist, Admin Accounts) */
export default function TabIntro({ tab, notesOnly }: { tab: string; notesOnly?: boolean }) {
  const mark = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // only what comes after it: the tab's own contents. Not the page head (title, tabs, Export) or the message banner, which are
    // before it when it sits straight in the console's main column (Classes & Events tabs; fixed v5.89)
    // the streamed data (.tab-data) and its skeleton don't animate (v6.02: they just appear); display:contents wrappers
    // (BookingCards) are looked through, since a transform does nothing on them
    const parts: HTMLElement[] = [];
    const add = (el: Element) => {
      if (!(el instanceof HTMLElement) || el.matches(".overlay, .tab-data")) return;
      if (getComputedStyle(el).display === "contents") Array.from(el.children).forEach(add);
      else parts.push(el);
    };
    for (let el = mark.current!.nextElementSibling; el; el = el.nextElementSibling) add(el);
    const t = tabIntro(parts, notesOnly);
    const stop = afterSplash(t.play);
    return () => { stop(); t.revert(); };
  }, [tab, notesOnly]);
  return <span ref={mark} hidden />;
}
