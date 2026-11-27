"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/* Site-wide background photo (spec §4, v6.49). Mounted once in the root layout. Box sizes live in globals.css (.pbg-*).
   Desktop/tablet: PHOTO shows its full width at its own proportions at the top of the screen, its bottom edge fading into
   the black page. At the top of the page the top START of the photo is above the screen; scrolling to the bottom drifts it up
   until its bottom edge meets the screen's bottom, or by DRIFT of its height if it's shorter than that.
   Phones (narrower than MOBILE.minDesktop): a separate photo, MOBILE.src (a player serving), filling the whole screen and
   at least MOBILE.span screens tall (its sides are trimmed, centred). At the top of the page the top MOBILE.start of the photo
   is above the screen (0 = its top edge at the screen's top); scrolling to the bottom of the page pans it up until its bottom edge meets the screen's bottom, so the whole
   height of the photo has been seen.
   A dark scrim (45%; 65% in the admin console, v6.59, set in globals.css) and a top-down gradient (50% at the top → clear at the bottom, v6.60) keep text readable. Reduced motion: the photo stays at its start. */
const PHOTO = { src: "/images/scbgphoto3.jpg", w: 2048, h: 1365 };
const START = .29; // desktop: fraction of the photo above the screen at the top of the page
const DRIFT = 0.15; // desktop: fraction of the photo's height it moves up by the bottom of the page, when it doesn't fill the screen
const MOBILE = {
  minDesktop: 700, // screens narrower than this (px) use the phone photo + framing; keep in step with the media query in globals.css
  src: "/images/scbgphoto1.jpg", // phone photo (only this one is downloaded on phones)
  w: 1365, // its pixel width
  h: 2048, // its pixel height
  start: 0.12, // where the photo starts at the top of the page: fraction of its height above the screen (0 = top edge; it never goes past its bottom edge)
  span: 1.25, // photo height as a multiple of the screen height (min); more = more panning while scrolling, but more of the sides trimmed
};

export default function ParallaxBackground() {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const phone = window.matchMedia(`(max-width: ${MOBILE.minDesktop - 1}px)`);
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power2.out" });
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const scrollable = document.documentElement.scrollHeight - vh;
      const progress = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;
      const boxH = el.offsetHeight;
      let from: number, to: number;
      if (phone.matches) {
        // the photo fills the screen: from its start point → bottom edge at the screen's bottom
        to = Math.min(vh - boxH, 0);
        from = Math.max(-MOBILE.start * boxH, to);
      } else {
        from = -boxH * START;
        // bottom edge at the screen's bottom when the photo is tall enough, otherwise a gentle DRIFT upward
        to = Math.min(vh - boxH, from - boxH * DRIFT);
      }
      yTo(from + progress * (to - from));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    phone.addEventListener("change", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      phone.removeEventListener("change", schedule);
      if (frame) cancelAnimationFrame(frame);
      gsap.killTweensOf(el);
    };
  }, []);

  // settings handed to the CSS (.pbg-img in globals.css), so the first paint is already framed right before this script runs
  const vars = {
    "--pbg-src": `url(${PHOTO.src})`,
    "--pbg-ratio": PHOTO.w / PHOTO.h,
    "--pbg-src-m": `url(${MOBILE.src})`,
    "--pbg-ratio-m": MOBILE.w / MOBILE.h,
    "--pbg-span-m": MOBILE.span,
    "--pbg-start-m": MOBILE.start,
    "--pbg-start": START,
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div ref={imgRef} className="pbg-img" style={vars}>
        {/* the photo's bottom edge melts into the black page below it (desktop only; on phones the photo fills the screen) */}
        <div className="pbg-fade absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-b from-transparent to-black" />
      </div>
      <div className="pbg-scrim absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/20 to-transparent" />
    </div>
  );
}
