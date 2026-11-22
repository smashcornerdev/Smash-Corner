"use client";
import { gsap } from "gsap";
import { useLayoutEffect, useRef } from "react";
import { Icon } from "@/components/art";

/* Home search bar sport toggle (spec "Home hero", v5.29; sliding highlight v5.31): real radio buttons (arrow keys work, and it
   submits without JavaScript, where the checked option is simply lavender). With JavaScript a lavender pill sits behind the
   checked option and slides across to the other one when it changes. Reduced motion: the pill jumps. */
export default function HeroSport() {
  const set = useRef<HTMLFieldSetElement>(null), pill = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const fs = set.current!, p = pill.current!;
    const cs = getComputedStyle(fs), on = cs.getPropertyValue("--on-accent").trim(), off = cs.getPropertyValue("--fg").trim();
    const place = (animate: boolean) => {
      const span = fs.querySelector("input:checked + span") as HTMLElement | null;
      if (!span) return;
      // the pill copies the checked option's exact box (sub-pixel, from the fieldset's edge). Not CSS top/bottom: inside a
      // <fieldset> those don't resolve against its padding box, so the pill came out 8px too tall (v5.32)
      const f = fs.getBoundingClientRect(), r = span.getBoundingClientRect();
      const to = { x: r.left - f.left, y: r.top - f.top, width: r.width, height: r.height };
      const anim = animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (anim) gsap.to(p, { ...to, duration: 0.45, ease: "power3.out" });
      else gsap.set(p, to);
      // label text turns dark as the pill arrives under it (and light again as it leaves), so it never sits dark on the dark bar
      fs.querySelectorAll<HTMLElement>("label > span").forEach((s) => {
        const color = s === span ? on : off;
        if (anim) gsap.to(s, { color, duration: 0.25, delay: s === span ? 0.12 : 0, ease: "power1.out" });
        else gsap.set(s, { color });
      });
    };
    place(false);
    fs.classList.add("ready");
    const onChange = () => place(true);
    const ro = new ResizeObserver(() => place(false)); // phones stretch the options; fonts can load late
    ro.observe(fs);
    fs.addEventListener("change", onChange);
    return () => { fs.removeEventListener("change", onChange); ro.disconnect(); };
  }, []);
  return (
    <fieldset className="q-sport" ref={set}>
      <legend className="sr-only">Sport</legend>
      <span className="q-sport-pill" ref={pill} aria-hidden="true" />
      <label><input type="radio" name="sport" value="tennis" defaultChecked /><span><Icon name="ball" />Tennis</span></label>
      <label><input type="radio" name="sport" value="pickle" /><span><Icon name="paddle" />Pickleball</span></label>
    </fieldset>
  );
}
