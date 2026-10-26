import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

/* sitemap.xml (spec §5): public pages only; admin, cart and payment routes are excluded */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/courts", "/book", "/gallery", "/programs", "/contact", "/policy", "/privacy", "/terms"];
  return pages.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: p === "/book" ? "daily" : "monthly", priority: p === "" ? 1 : p === "/book" ? 0.9 : 0.6 }));
}
