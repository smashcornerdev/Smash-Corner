"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/* Gallery head start (spec §3, v6.69): on the first page a visitor opens (any public page), once that page has fully loaded and
   the browser is idle, the first 20 Gallery photos are downloaded in the background into the browser cache. Opening the Gallery
   afterwards finds them already there, so the first screenful only plays its rise-in. Runs once per visit (per tab load), not
   on the Gallery itself (it loads its own), and not when the visitor has asked to save data. The URLs come from the server
   (layout) so the 157-photo list isn't shipped with every page. */
let started = false;

export default function GalleryPreload({ urls }: { urls: string[] }) {
  const path = usePathname();
  useEffect(() => {
    if (started || path === "/gallery") return;
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
    let idle = 0, timer = 0;
    const go = () => {
      if (started) return;
      started = true;
      for (const u of urls) {
        const img = new Image();
        img.referrerPolicy = "no-referrer"; // same request as the Gallery's own photos, so the cached copy is reused
        img.decoding = "async";
        img.src = u;
      }
    };
    // after the page's own load, then when the browser is idle (or 2 s later where there's no idle callback, e.g. Safari)
    const whenIdle = () => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(go, { timeout: 4000 });
      else timer = setTimeout(go, 2000) as unknown as number;
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });
    return () => {
      window.removeEventListener("load", whenIdle);
      if (idle) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, [path, urls]);
  return null;
}
