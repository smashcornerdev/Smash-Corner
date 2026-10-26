"use client";
import { useEffect, useState } from "react";

/** live "time left" for cart holds, claims and payment deadlines */
export default function Countdown({ until, onEnd }: { until: string; onEnd?: () => void }) {
  const end = new Date(until).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, end - now);
  useEffect(() => { if (ms === 0) onEnd?.(); }, [ms, onEnd]);
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return <span className="tabnum" suppressHydrationWarning>{h ? `${h}:${pad(m)}` : m}:{pad(x)}</span>;
}
