"use client";
import { useLayoutEffect } from "react";
import { afterSplash } from "@/lib/gsap/afterSplash";
import { pageIntro } from "@/lib/gsap/pageIntro";
import { sectionReveal } from "@/lib/gsap/sectionReveal";

/* Page motion (spec §4). Home mounts it next to HeroIntro for the scroll reveals; every other public page gets it through
   PageTop with `intro`, which also plays the page-top entrance (eyebrow + title from the left, lead from the right, then the sub tabs one by one). Both start once the splash is gone
   (straight away on client navigation). Off with reduced motion: everything is simply there. */
export default function SectionReveal({ intro = false }: { intro?: boolean }) {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.getElementById("main");
    if (!main) return;
    const top = intro ? main.querySelector(".page-top") : null;
    const pi = top ? pageIntro(top, main) : null;
    const sr = sectionReveal(main);
    const stop = afterSplash(() => { pi?.play(); sr.play(); });
    return () => { stop(); pi?.revert(); sr.revert(); };
  }, [intro]);
  return null;
}
