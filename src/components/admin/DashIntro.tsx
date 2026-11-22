"use client";
import { useLayoutEffect } from "react";
import { afterSplash } from "@/lib/gsap/afterSplash";
import { dashIntro } from "@/lib/gsap/dashIntro";

/* Dashboard entrance (spec §4 / §7, v5.70): title from the right, stat cards one by one in reading order, then each section's
   header from the right and its table from the top left. Starts once the splash is gone; off with reduced motion. */
export default function DashIntro() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scope = document.querySelector(".adm-main");
    if (!scope) return;
    const d = dashIntro(scope.querySelector(".adm-top h1"), scope);
    const stop = afterSplash(d.play);
    return () => { stop(); d.revert(); };
  }, []);
  return null;
}
