import { Suspense } from "react";

/* A tab's data (spec §7, v6.01). The tab's text (note, headings) is sent straight away and shows at once when the tab is opened;
   the data streams in after it. Until then `fallback` (a skeleton) shows; then the data simply appears (v6.02: no entrance
   animation for the skeleton or the data). `.tab-data` is display:contents, so the page's layout and gaps are unchanged, and
   the tab entrance (TabIntro) skips it. */
export default function TabData({ fallback, children }: { tab?: string; fallback: React.ReactNode; children: React.ReactNode }) {
  return <div className="tab-data"><Suspense fallback={fallback}>{children}</Suspense></div>;
}
