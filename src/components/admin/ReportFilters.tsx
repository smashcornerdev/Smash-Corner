"use client";
import { useLayoutEffect, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SkelReports } from "@/components/admin/Skeleton";
import { customRangeIn } from "@/lib/gsap/customRangeIn";

type Sel = { r: string; c: string; from: string; to: string };

/* Reports filters (spec §19). A click highlights the filter at once and the skeleton replaces the data until the new figures arrive.
   Custom only opens its From / To boxes (no request); the data loads on Apply. The old data stays mounted, hidden, while
   loading so the KPIs still count on from their previous values. */
export default function ReportFilters({ ranges, courts, range, court, from, to, children }: {
  ranges: { k: string; label: string }[]; courts: { id: string; name: string }[]; range: string; court: string; from: string; to: string; children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [loading, start] = useTransition();
  const [sel, pick] = useOptimistic<Sel>({ r: range, c: court, from, to }); // what was last clicked, ahead of the server's answer
  const [open, setOpen] = useState(range === "custom");
  // follow the applied range when it changes some other way (browser Back / Forward)
  const [seen, setSeen] = useState(range);
  if (seen !== range) {
    setSeen(range);
    if (range === "custom" || seen === "custom") setOpen(range === "custom");
  }

  // the boxes animate in only when Custom is clicked, not when the page loads or re-renders after Apply
  const form = useRef<HTMLFormElement>(null);
  const animateIn = useRef(false);
  useLayoutEffect(() => {
    if (!open || !animateIn.current || !form.current) return;
    animateIn.current = false;
    const tl = customRangeIn(form.current);
    return () => { tl.kill(); };
  }, [open]);
  const openCustom = () => {
    animateIn.current = !open && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setOpen(true);
  };

  const url = (s: Sel) => `${path}?${new URLSearchParams({ r: s.r, c: s.c, ...(s.r === "custom" ? { from: s.from, to: s.to } : {}) })}`;
  const go = (next: Partial<Sel>) => {
    const s = { ...sel, ...next }, target = url(s);
    if (target === url(sel)) return; // already showing it
    start(() => { pick(s); router.push(target, { scroll: false }); });
  };
  // Ctrl / middle clicks still open the link in a new tab
  const click = (e: React.MouseEvent, run: () => void) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    run();
  };
  const apply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    go({ r: "custom", from: String(f.get("from")), to: String(f.get("to")) });
  };

  return (
    <>
      <div className="rep-filters">
        <div className="chips">
          {ranges.map((r) => (
            <Link key={r.k} prefetch={false} className={"chip" + (!open && sel.r === r.k ? " on" : "")} href={url({ ...sel, r: r.k })} onClick={(e) => click(e, () => { setOpen(false); go({ r: r.k }); })}>{r.label}</Link>
          ))}
          <button type="button" className={"chip" + (open ? " on" : "")} aria-expanded={open} aria-controls="rep-custom" onClick={openCustom}>Custom</button>
        </div>
        <div className="chips">
          {courts.map((c) => <Link key={c.id} prefetch={false} className={"chip" + (sel.c === c.id ? " on" : "")} href={url({ ...sel, c: c.id })} onClick={(e) => click(e, () => go({ c: c.id }))}>{c.name}</Link>)}
        </div>
      </div>
      {open ? (
        /* keyed by the applied dates so the boxes show them tidied after Apply (swapped or shortened) */
        <form className="rep-custom" id="rep-custom" key={`${from}_${to}`} ref={form} onSubmit={apply}>
          <label className="f"><span>From</span><input className="inp" type="date" name="from" defaultValue={from} required /></label>
          <label className="f"><span>To</span><input className="inp" type="date" name="to" defaultValue={to} required /></label>
          <button className="btn btn-lime btn-sm" type="submit" disabled={loading}>Apply</button>
        </form>
      ) : null}
      {loading ? <SkelReports courts={courts.length - 1} /> : null}
      <div className="tab-data" style={loading ? { display: "none" } : undefined}>{children}</div>
    </>
  );
}
