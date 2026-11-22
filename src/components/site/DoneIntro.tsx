"use client";
import { gsap } from "gsap";
import { useLayoutEffect } from "react";
import { afterSplash } from "@/lib/gsap/afterSplash";

/* Request-sent page entrance (spec §4, v5.47, v5.48): everything moves at once, no stagger: the header (eyebrow + "Request sent")
   slides in from the left while the content below it (reference numbers, status text, booking list, cancel note, button)
   slides in from the right. Waits for the splash; off with reduced motion. Targets are the .done-hero's children. */
export default function DoneIntro() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = document.querySelector(".done-hero");
    if (!hero) return;
    const kids = Array.from(hero.children);
    const head = kids.filter((k) => k.matches(".eyebrow, h1")), body = kids.filter((k) => !head.includes(k));
    const ctx = gsap.context(() => {
      gsap.set(head, { autoAlpha: 0, x: -80 });
      gsap.set(body, { autoAlpha: 0, x: 80 });
    });
    const stop = afterSplash(() => ctx.add(() => {
      gsap.timeline({ defaults: { ease: "expo.out", duration: 0.9, clearProps: "transform,opacity,visibility" } })
        .to(head, { autoAlpha: 1, x: 0 }, 0)
        .to(body, { autoAlpha: 1, x: 0 }, 0);
    }));
    return () => { stop(); ctx.revert(); };
  }, []);
  return null;
}
