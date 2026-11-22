"use client";
import { useLayoutEffect } from "react";
import { afterSplash } from "@/lib/gsap/afterSplash";
import { heroIntro } from "@/lib/gsap/heroIntro";

/* Landing-page entrance (spec §4): hidden while the splash plays, then animated in as soon as the splash is gone
   (straight away when there's no splash, e.g. arriving from another page). Off with reduced motion. */
export default function HeroIntro() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const intro = heroIntro(document.body); // only the hero and ticker animate; the header is already in place (v5.18)
    const stop = afterSplash(intro.play);
    return () => { stop(); intro.revert(); };
  }, []);
  return null;
}
