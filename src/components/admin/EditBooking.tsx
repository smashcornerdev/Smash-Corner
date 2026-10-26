"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editBookingAction } from "@/app/actions/admin";
import { HOURS } from "@/lib/config";
import { fmtH } from "@/lib/time";
import type { Court, EquipmentItem } from "@/lib/types";

type St = Record<number, string>;

/* Edit / Reschedule a confirmed booking (spec §7 Admin Flows): court, date, time, players, equipment */
export default function EditBooking({ b, courts, items, today }: {
  b: { id: string; court_id: string; date: string; hours: number[]; players: number; equipment: Record<string, number> };
  courts: Court[]; items: EquipmentItem[]; today: string;
}) {
  const router = useRouter();
  const [court, setCourt] = useState(b.court_id);
  const [date, setDate] = useState(b.date);
  const [hours, setHours] = useState<number[]>(b.hours);
  const [players, setPlayers] = useState(String(b.players));
  const [eq, setEq] = useState<Record<string, number>>(b.equipment);
  const [states, setStates] = useState<St | null>(null);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const c = courts.find((x) => x.id === court)!;
  const own = (h: number) => court === b.court_id && date === b.date && b.hours.includes(h);

  useEffect(() => {
    setStates(null);
    fetch(`/api/availability?court=${court}&date=${date}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setStates(d.hours ?? {})).catch(() => setStates({}));
  }, [court, date]);

  const save = () => {
    setErr("");
    start(async () => {
      const r = await editBookingAction({
        id: b.id, courtId: court, date, hours, players: parseInt(players, 10) || 0,
        equipment: Object.fromEntries(Object.entries(eq).filter(([k, v]) => v > 0 && items.find((i) => i.id === k)?.type === c.type)),
      });
      if (!r.ok) setErr(r.error ?? "Something went wrong.");
      else router.push(`/admin/bookings/view/${b.id}?msg=${encodeURIComponent(r.msg ?? "Saved.")}&k=ok`);
    });
  };

  return (
    <div className="stack">
      <div className="form-grid">
        <label className="f"><span>Court</span>
          <select className="inp" value={court} onChange={(e) => { setCourt(e.target.value); setHours([]); setEq({}); }}>
            {courts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="f"><span>Date</span><input className="inp" type="date" min={today} value={date} onChange={(e) => { if (e.target.value) { setDate(e.target.value); setHours([]); } }} /></label>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span style={{ fontSize: ".86rem", color: "var(--muted)" }}>Time (click to toggle)</span>
        <div className="slots">
          {HOURS.map((h) => {
            const s = states?.[h], sel = hours.includes(h);
            const ok = s === "open" || own(h);
            if (ok || sel) return <button key={h} type="button" className={"slot open" + (sel ? " sel" : "")} onClick={() => setHours(sel ? hours.filter((x) => x !== h) : [...hours, h].sort((x, y) => x - y))}><b>{fmtH(h)}</b><small>{sel ? "Selected" : "Open"}</small></button>;
            return <div key={h} className={"slot " + (s === "past" ? "past" : "taken")}><b>{fmtH(h)}</b><small>{s === "past" ? "Passed" : states ? "Unavailable" : "…"}</small></div>;
          })}
        </div>
      </div>
      <div className="form-grid">
        <label className="f"><span>Players ({c.min_players}–{c.max_players})</span><input className="inp" type="number" min={c.min_players} max={c.max_players} value={players} onChange={(e) => setPlayers(e.target.value)} /></label>
        {items.filter((i) => i.type === c.type).map((i) => (
          <label className="f" key={i.id}><span>{i.name}</span><input className="inp" type="number" min={0} value={eq[i.id] ?? 0} onChange={(e) => setEq({ ...eq, [i.id]: Math.max(0, parseInt(e.target.value, 10) || 0) })} /></label>
        ))}
      </div>
      {err ? <em className="err">{err}</em> : null}
      <div className="row"><button className="btn btn-lime" type="button" disabled={pending} onClick={save}>{pending ? "Saving…" : "Finish & notify customer"}</button></div>
    </div>
  );
}
