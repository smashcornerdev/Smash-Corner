"use client";
import { useEffect, useRef, useState } from "react";
import { Arrow, Ph } from "@/components/art";
import { GALLERY, GALLERY_TONES } from "@/lib/gallery";

/* Gallery (spec §3): 4 one-screen sections, sticky tabs (☰ dropdown on phones), scroll-spy, lightbox with next/previous. */
export default function GalleryView() {
  const [active, setActive] = useState<string>(GALLERY[0].id);
  const [menu, setMenu] = useState(false);
  const [lb, setLb] = useState<number | null>(null);
  const bar = useRef<HTMLDivElement>(null);
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
    document.getElementById("g-" + id)?.scrollIntoView();
    setActive(id);
    setMenu(false);
  };
  const cur = GALLERY.find((g) => g.id === active)!;
  const p = lb !== null ? photos[lb] : null;

  return (
    <>
      <div className="gal-tabs" ref={bar}>
        <div className="wrap">
          <div className={"hm hm-sub gal-hm" + (menu ? " open" : "")}>
            <button type="button" className="hm-btn" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              <span className="hm-ic" aria-hidden="true">☰</span><span className="hm-cur">{cur.name}</span>
              <span className="hm-car" aria-hidden="true"><Arrow dir="d" /></span>
            </button>
            <div className="hm-list gal-list" role="tablist" aria-label="Gallery sections">
              {GALLERY.map((g) => (
                <button key={g.id} role="tab" className={active === g.id ? "on" : ""} aria-selected={active === g.id} onClick={() => jump(g.id)}>{g.name}</button>
              ))}
            </div>
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
