"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Arrow } from "@/components/art";
import { GALLERY, driveImg } from "@/lib/gallery";
import { afterSplash } from "@/lib/gsap/afterSplash";

const LINE = 0.88; // while scrolling, a photo rises in once its top passes 88% of the way down the screen (same spot as the site's scroll reveals)
const DONE = { clearProps: "transform,opacity,visibility" };

/* Gallery (spec §3, v6.52): every photo from src/data/gallery.json in one uncropped masonry layout (no sections or tabs), loaded
   lazily as they scroll into view, and a lightbox with next/previous (arrow keys too; Escape closes).
   Rise-in (v6.53; own code since v6.56): each photo starts hidden 40 px low and rises in as it comes into view. Positions are read
   live on every scroll / resize / photo load instead of from ScrollTrigger's saved trigger points, which went stale as photos
   loaded and changed height (coming back to the page on a slow connection left photos above the screen hidden). Photos already
   scrolled past just appear.
   First screenful (v6.62): every photo's size is in gallery.json (w, h), so each tile has its real shape from the first frame and
   the masonry never reshuffles as photos load. On arrival, every photo visible anywhere on the screen rises in together (one
   staggered batch, down to the very bottom edge); the photos below then rise in as you scroll. */
export default function GalleryView() {
  const [lb, setLb] = useState<number | null>(null);
  const n = GALLERY.length;
  const grid = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Whether a photo has risen in is kept on the photo itself (data-up), not in this effect: arriving from another page, Next can
    // mount the gallery, tear it down and mount it again a moment later (v6.56 fix). Keeping it here meant the second mount hid
    // the photos all over again, and the teardown in between snapped them visible with no animation.
    const up = (b: HTMLElement) => b.dataset.up === "1";
    if (still) items.forEach((b) => { b.dataset.up = "1"; });
    else gsap.set(items.filter((b) => !up(b)), { autoAlpha: 0, y: 40 });
    let raf = 0, watching = false, first = true;
    const check = () => {
      raf = 0;
      // Coming from another page the gallery can be in the page before it is laid out (hidden, every photo at 0,0) and before
      // the page has scrolled back to the top, so a photo would look "on screen" or "already scrolled past" when it is neither,
      // and every photo was marked shown at once with no animation (v6.58). Only look once the grid really has a size.
      if (!watching || !el.offsetParent || el.getBoundingClientRect().height === 0) return;
      // the first look takes the whole screen (everything you can see rises in together); after that, the 88% line
      const line = window.innerHeight * (first ? 1 : LINE);
      first = false;
      const past: HTMLElement[] = [], now: { el: HTMLElement; top: number; left: number }[] = [];
      for (const it of items) {
        if (up(it)) continue;
        const r = it.getBoundingClientRect();
        if (r.bottom < 0) past.push(it);
        else if (r.top < line) now.push({ el: it, top: Math.round(r.top / 40), left: r.left });
      }
      past.forEach((x) => { x.dataset.up = "1"; });
      if (past.length) gsap.set(past, DONE);
      if (now.length) {
        now.sort((a, b) => a.top - b.top || a.left - b.left); // reading order on screen, not the masonry's column order
        now.forEach((x) => { x.el.dataset.up = "1"; });
        // 0.15 s apart, but a big batch (jumping far down) is squeezed into 0.6 s so the last ones don't wait seconds
        gsap.to(now.map((x) => x.el), { autoAlpha: 1, y: 0, duration: 0.8, stagger: Math.min(0.15, 0.6 / now.length), ease: "expo.out", ...DONE });
      }
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
    // Downloads (v6.63): the gallery starts each photo itself when it comes within 600 px of the screen, instead of relying on
    // loading="lazy". Arriving from another page, React builds the new page's photos before putting them in the page, and Chrome
    // then downloaded all 157 at once and ignored "lazy". The photos are rendered with no src (data-src) and get one here.
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const img = e.target as HTMLImageElement;
      if (img.dataset.src && !img.getAttribute("src")) img.src = img.dataset.src;
      io.unobserve(img);
    }), { rootMargin: "600px 0px" });
    items.forEach((b) => { const img = b.querySelector("img"); if (img && !img.getAttribute("src")) io.observe(img); });
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    // start two frames after the splash has gone (straight away when there is none): the router scrolls the new page to the top
    // after this runs, and the first look must see the page where it will actually be
    let startRaf = 0;
    const stop = afterSplash(() => { startRaf = requestAnimationFrame(() => { startRaf = requestAnimationFrame(() => { watching = true; check(); }); }); });
    check();
    return () => {
      stop(); io.disconnect(); cancelAnimationFrame(raf); cancelAnimationFrame(startRaf);
      window.removeEventListener("scroll", queue); window.removeEventListener("resize", queue);
      // rises already started keep playing (the photos stay in the page through a remount; on a real exit they go with it), and
      // photos not yet risen stay hidden for the next mount to bring up
    };
  }, []);

  useEffect(() => {
    if (lb === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLb(null);
      if (e.key === "ArrowRight") setLb((i) => ((i ?? 0) + 1) % n);
      if (e.key === "ArrowLeft") setLb((i) => ((i ?? 0) - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lb, n]);

  const p = lb !== null ? GALLERY[lb] : null;
  return (
    <>
      <section className="wrap gal-all" aria-label="Photos" ref={grid}>
        {GALLERY.map((g, i) => (
          // the tile itself carries the photo's shape (v6.69): an <img> with no src yet doesn't reliably keep it (it rendered too short
          // until its photo arrived, so the first look saw the wrong photos on screen)
          <button key={g.id} onClick={() => setLb(i)} aria-label={`Open photo ${i + 1} of ${n}`} style={{ aspectRatio: `${g.w} / ${g.h}` }}>
            {/* no src until the photo nears the screen (v6.63, set by the effect above) */}
            <img decoding="async" referrerPolicy="no-referrer" width={g.w} height={g.h}
              data-src={driveImg(g.id, 800)} alt={`Smash Corner photo ${i + 1}`} />
          </button>
        ))}
      </section>
      {p && lb !== null ? (
        <div className="overlay" role="dialog" aria-modal="true" aria-label={`Photo ${lb + 1} of ${n}`} onClick={(e) => e.target === e.currentTarget && setLb(null)}>
          <div className="lb">
            <img className="lb-img" key={p.id} src={driveImg(p.id, 2000)} alt={`Smash Corner photo ${lb + 1}`} referrerPolicy="no-referrer" />
            <div className="lb-bar">
              <span>{lb + 1} of {n}</span>
              <div className="row">
                <button className="btn btn-ghost btn-sm" onClick={() => setLb((lb - 1 + n) % n)}><Arrow dir="l" /> Previous</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setLb((lb + 1) % n)}>Next <Arrow /></button>
                <button className="x" aria-label="Close" onClick={() => setLb(null)}>×</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
