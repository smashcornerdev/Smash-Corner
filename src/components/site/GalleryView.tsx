"use client";
import { useEffect, useRef, useState } from "react";
import { Arrow, Ph } from "@/components/art";
import { GALLERY, GALLERY_TONES } from "@/lib/gallery";
import { glideTo, useTabPill } from "./tabMotion";

/* Gallery (spec §3): 4 one-screen sections, sticky tabs (one row side by side on phones too, v5.56; was a ☰ dropdown), scroll-spy,
   lightbox with next/previous. A tab click glides the page to its section (GSAP ScrollToPlugin, v5.56), and the violet highlight slides from tab to tab
   whenever the active section changes, by click or by scrolling (v5.56). Reduced motion: instant jump, highlight just moves. */
export default function GalleryView() {
  const [active, setActive] = useState<string>(GALLERY[0].id);
  const [lb, setLb] = useState<number | null>(null);
  const bar = useRef<HTMLDivElement>(null), list = useRef<HTMLDivElement>(null), pill = useRef<HTMLSpanElement>(null);
  const photos = GALLERY.flatMap((g, gi) => Array.from({ length: 6 }, (_, i) => ({ g, i, tone: GALLERY_TONES[(i + gi) % 6] })));

  useEffect(() => {
    const onScroll = () => {
      const y = (bar.current?.getBoundingClientRect().bottom ?? 0) + 40;
      let cur: string = GALLERY[0].id;
      for (const g of GALLERY) {
        const el = document.getElementById("g-" + g.id);
        if (el && el.getBoundingClientRect().top <= y) cur = g.id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useTabPill(list, pill, active); // sliding highlight (tabMotion.ts)
  useEffect(() => {
    if (lb === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLb(null);
      if (e.key === "ArrowRight") setLb((i) => ((i ?? 0) + 1) % photos.length);
      if (e.key === "ArrowLeft") setLb((i) => ((i ?? 0) - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lb, photos.length]);

  const jump = (id: string) => {
    (document.activeElement as HTMLElement | null)?.blur(); // the highlight belongs to the section on screen, not the clicked tab
    const el = document.getElementById("g-" + id);
    if (!el) return;
    // lands where scrollIntoView would: the section's top just under the header + tab bar (its scroll-margin-top)
    glideTo(el, parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
  };
  const p = lb !== null ? photos[lb] : null;

  return (
    <>
      <div className="gal-tabs" ref={bar}>
        <div className="wrap">
          <div className="gal-list" ref={list} role="tablist" aria-label="Gallery sections">
            {/* grey tab backgrounds, then the sliding highlight, both under the tab text (v5.60: real elements, not ::before inside
                the buttons, which iOS Safari drew over the highlight) */}
            {GALLERY.map((g) => <span className="tab-slot" aria-hidden="true" key={g.id} />)}
            <span className="gal-pill" ref={pill} aria-hidden="true" />
            {GALLERY.map((g) => (
              <button key={g.id} role="tab" className={active === g.id ? "on" : ""} aria-selected={active === g.id} onClick={() => jump(g.id)}>{g.name}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="wrap">
        {GALLERY.map((g, gi) => (
          <section className="gal-sec" id={"g-" + g.id} aria-label={g.name} key={g.id}>
            <div className="gal-sh"><h2>{g.name}</h2></div>
            <div className="gal-grid">
              {Array.from({ length: 6 }, (_, i) => (
                <button key={i} onClick={() => setLb(gi * 6 + i)} aria-label={`Open ${g.name} photo ${i + 1}`}>
                  <Ph kind={g.kind} tone={GALLERY_TONES[(i + gi) % 6]} label={`${g.name} photo ${i + 1}`} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      {p && lb !== null ? (
        <div className="overlay" role="dialog" aria-modal="true" aria-label={`${p.g.name} photo ${p.i + 1}`} onClick={(e) => e.target === e.currentTarget && setLb(null)}>
          <div className="lb">
            <Ph kind={p.g.kind} tone={p.tone} label={`${p.g.name} photo ${p.i + 1}`} />
            <div className="lb-bar">
              <span>{p.g.name} · {p.i + 1} of 6</span>
              <div className="row">
                <button className="btn btn-ghost btn-sm" onClick={() => setLb((lb - 1 + photos.length) % photos.length)}><Arrow dir="l" /> Previous</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setLb((lb + 1) % photos.length)}>Next <Arrow /></button>
                <button className="x" aria-label="Close" onClick={() => setLb(null)}>×</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
