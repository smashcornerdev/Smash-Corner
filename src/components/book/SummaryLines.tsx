"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { lineIn, lineOut, valueIn } from "@/lib/gsap/summaryMotion";

/** One row of the booking summary: `k` identifies it across renders, `value` is what changes. */
export type SumLine = { k: string; label: ReactNode; value: string; cls?: string; valueCls?: string; valueStyle?: React.CSSProperties };
type Shown = SumLine & { leaving?: boolean };

// keep rows that just went away in place (marked leaving) so they can animate out
function merge(old: Shown[], next: SumLine[]): Shown[] {
  const out: Shown[] = [...next];
  const keys = new Set(next.map((l) => l.k));
  old.forEach((l, i) => { if (!keys.has(l.k)) out.splice(Math.min(i, out.length), 0, { ...l, leaving: true }); });
  return out;
}
const sigOf = (ls: SumLine[]) => ls.map((l) => l.k + "=" + l.value).join("|");

/* Booking summary rows (spec §6, v5.34): rows added or removed unfold / fold, and a value that changes drops into place.
   Nothing animates when the summary first appears. */
export default function SummaryLines({ lines }: { lines: SumLine[] }) {
  const [sig, setSig] = useState(() => sigOf(lines));
  const [shown, setShown] = useState<Shown[]>(lines);
  const now = sigOf(lines);
  if (now !== sig) { setSig(now); setShown(merge(shown, lines)); } // adjust during render: no flash of the old rows

  const box = useRef<HTMLDivElement>(null);
  const seen = useRef<Map<string, string> | null>(null); // row key → value as last painted
  const leavingNow = useRef(new Set<string>());
  useLayoutEffect(() => {
    const rows = Array.from(box.current?.children ?? []) as HTMLElement[];
    const prev = seen.current;
    seen.current = new Map(shown.filter((l) => !l.leaving).map((l) => [l.k, l.value]));
    if (!prev) return;
    const added: HTMLElement[] = [], changed: HTMLElement[] = [];
    rows.forEach((el) => {
      const k = el.dataset.k!;
      if (el.dataset.leaving) {
        if (leavingNow.current.has(k)) return;
        leavingNow.current.add(k);
        lineOut(el, () => { leavingNow.current.delete(k); setShown((s) => s.filter((l) => !(l.k === k && l.leaving))); });
      } else if (!prev.has(k)) added.push(el);
      else if (prev.get(k) !== el.dataset.v) changed.push(el.lastElementChild as HTMLElement);
    });
    lineIn(added);
    valueIn(changed);
  }, [shown]);

  return (
    <div ref={box} style={{ display: "contents" }}>
      {shown.map((l) => (
        <div key={l.k + (l.leaving ? "~" : "")} className={"line" + (l.cls ? " " + l.cls : "")} data-k={l.k} data-v={l.value} data-leaving={l.leaving ? "1" : undefined} aria-hidden={l.leaving || undefined}>
          <span>{l.label}</span><span className={l.valueCls} style={l.valueStyle}>{l.value}</span>
        </div>
      ))}
    </div>
  );
}
