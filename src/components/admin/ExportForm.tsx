"use client";
import { useEffect, useMemo, useState } from "react";
import ModalButton from "@/components/admin/Modal";
import { Pill } from "@/components/ui";
import { peso } from "@/lib/format";
import { addDaysKey, fmtDate, parseKey, todayKey } from "@/lib/time";
import { ST_LABEL } from "@/lib/types";

/* Export to Excel window (spec §7; mockup "Export customer records"): records, statuses, courts, dates, classes.
   A live preview (count, total, first 5 rows) comes from /api/admin/export?preview=1; Download fetches the real .xlsx. */
const STS = ["pending", "awaiting", "verify", "approved", "rejected", "cancelled", "unpaid"];
const PRESETS: [string, string][] = [["month", "This month"], ["last-month", "Last month"], ["l30", "Last 30 days"], ["n30", "Next 30 days"], ["year", "This year"], ["all", "All dates"]];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const monthEnd = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-based
const pad = (n: number) => String(n).padStart(2, "0");

function presetRange(p: string): [string, string] {
  const t = todayKey(), { y, m } = parseKey(t);
  if (p === "month") return [`${y}-${pad(m)}-01`, `${y}-${pad(m)}-${pad(monthEnd(y, m))}`];
  if (p === "last-month") { const ly = m === 1 ? y - 1 : y, lm = m === 1 ? 12 : m - 1; return [`${ly}-${pad(lm)}-01`, `${ly}-${pad(lm)}-${pad(monthEnd(ly, lm))}`]; }
  if (p === "l30") return [addDaysKey(t, -29), t];
  if (p === "n30") return [t, addDaysKey(t, 29)];
  if (p === "year") return [`${y}-01-01`, `${y}-12-31`];
  return ["", ""];
}

type Preview = { count: number; total: number; sample: (string | number)[][]; classes: { id: string; title: string; when: string; date: string; court: string; status: string }[] };

export default function ExportButton({ kind, courts }: { kind: "court" | "class"; courts: { id: string; name: string }[] }) {
  return (
    <ModalButton label="⤓ Export to Excel" cls="btn-lav" eyebrow="Export to Excel" title="Export customer records" wide>
      <ExportBody initial={kind} courts={courts} />
    </ModalButton>
  );
}

function ExportBody({ initial, courts }: { initial: "court" | "class"; courts: { id: string; name: string }[] }) {
  const [kind, setKind] = useState(initial);
  const [st, setSt] = useState<string[]>(["approved", "rejected", "cancelled"]);
  const [cx, setCx] = useState(courts.map((c) => c.id));
  const [preset, setPreset] = useState(initial === "class" ? "n30" : "month");
  const [[from, to], setRange] = useState(presetRange(initial === "class" ? "n30" : "month"));
  const [basis, setBasis] = useState<"play" | "submitted">("play");
  const [kx, setKx] = useState<string[] | null>(null); // null = every class in range
  const [pv, setPv] = useState<Preview | null>(null);
  const [err, setErr] = useState("");
  const isC = kind === "court";

  const query = useMemo(() => {
    const q = new URLSearchParams({ kind, from, to, basis });
    st.forEach((s) => q.append("stx", s));
    if (isC) cx.forEach((c) => q.append("cx", c));
    else (kx ?? []).forEach((k) => q.append("kx", k));
    return q;
  }, [kind, from, to, basis, st, cx, kx, isC]);
  const none = !st.length || (isC ? !cx.length : kx !== null && !kx.length);

  useEffect(() => {
    if (none) { setPv((p) => (p ? { ...p, count: 0, total: 0, sample: [] } : p)); return; }
    const ac = new AbortController();
    fetch(`/api/admin/export?preview=1&${query}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d: Preview) => { setPv(d); setErr(""); })
      .catch((e) => { if (e.name !== "AbortError") setErr("Couldn't load the preview. Check your connection."); });
    return () => ac.abort();
  }, [query, none]);

  const pick = (p: string) => { setPreset(p); setRange(presetRange(p)); setKx(null); };
  const toggle = (l: string[], v: string, on: boolean) => (on ? [...l, v] : l.filter((x) => x !== v));
  const rangeText = from || to ? `${from ? fmtDate(from) : "the start"} – ${to ? fmtDate(to) : "today onward"}` : "All dates";
  const classes = pv?.classes ?? [];
  const sel = kx ?? classes.map((k) => k.id);
  const count = none ? 0 : pv?.count ?? 0;

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (count) window.location.href = `/api/admin/export?${query}`; }}>
      <fieldset className="stack ex-fs"><legend>Records</legend>
        <div className="seg">
          <label><input type="radio" name="exKind" checked={isC} onChange={() => { setKind("court"); setKx(null); }} /> Court bookings</label>
          <label><input type="radio" name="exKind" checked={!isC} onChange={() => { setKind("class"); setKx(null); if (preset === "month") pick("n30"); }} /> Classes &amp; events</label>
        </div>
      </fieldset>
      <fieldset className="stack ex-fs"><legend>Status</legend>
        <div className="seg">{STS.map((s) => <label key={s}><input type="checkbox" checked={st.includes(s)} onChange={(e) => setSt(toggle(st, s, e.target.checked))} /> {cap(ST_LABEL[s])}</label>)}</div>
      </fieldset>
      {isC ? (
        <fieldset className="stack ex-fs"><legend>Courts</legend>
          <div className="seg">{courts.map((c) => <label key={c.id}><input type="checkbox" checked={cx.includes(c.id)} onChange={(e) => setCx(toggle(cx, c.id, e.target.checked))} /> {c.name}</label>)}</div>
        </fieldset>
      ) : null}
      <fieldset className="stack ex-fs"><legend>Dates</legend>
        <div className="chips">{PRESETS.map(([v, l]) => <button type="button" key={v} className={"chip" + (preset === v ? " on" : "")} onClick={() => pick(v)}>{l}</button>)}</div>
        <div className="form-grid">
          <label className="f"><span>From</span><input className="inp" type="date" value={from} onChange={(e) => { const f = e.target.value; setPreset(""); setKx(null); setRange([f, f && to && to < f ? f : to]); }} /></label>
          <label className="f"><span>To</span><input className="inp" type="date" value={to} onChange={(e) => { const t = e.target.value; setPreset(""); setKx(null); setRange([from, from && t && t < from ? from : t]); }} /></label>
          <label className="f full"><span>Date means</span>
            <select className="inp" value={basis} onChange={(e) => { setBasis(e.target.value as "play" | "submitted"); setKx(null); }}>
              <option value="play">{isC ? "Booking date (the day they play)" : "Class date"}</option><option value="submitted">Date submitted</option>
            </select>
          </label>
        </div>
        <p className="tp-hint" style={{ margin: 0 }}>Range: <b>{rangeText}</b></p>
      </fieldset>
      {!isC ? (
        <fieldset className="stack ex-fs"><legend>Classes / events{basis === "play" ? " in this date range" : ""}</legend>
          {classes.length ? (
            <>
              <div className="row" style={{ gap: 12 }}>
                <button type="button" className="linkbtn" onClick={() => setKx(null)}>Select all</button>
                <button type="button" className="linkbtn" onClick={() => setKx([])}>Clear</button>
                <span className="muted" style={{ fontSize: ".84rem" }}>{classes.filter((k) => sel.includes(k.id)).length} of {classes.length} selected</span>
              </div>
              <div className="ex-cls">{classes.map((k) => (
                <label className="check" key={k.id}><input type="checkbox" checked={sel.includes(k.id)} onChange={(e) => setKx(toggle(sel, k.id, e.target.checked))} />
                  <span><b>{k.title}</b><br /><small className="muted">{fmtDate(k.date)} · {k.when} · {k.court}{k.status === "cancelled" ? " · Cancelled" : ""}</small></span></label>
              ))}</div>
            </>
          ) : <div className="banner">No classes or events in this date range.</div>}
        </fieldset>
      ) : null}
      <div className={"banner" + (count ? " lime" : "")}><b>{pv || none ? `${count} record${count === 1 ? "" : "s"}` : "Counting records…"}</b>{pv || none ? " will be exported" : ""}{count ? ` · total ${peso(pv!.total)}` : ""}{pv || none ? "." : ""}</div>
      {count && pv ? (
        <>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr>{(isC ? ["Ref", "Customer", "Court", "Date", "Status", "Total"] : ["Ref", "Participant", "Class", "Class date", "Status", "Total"]).map((h) => <th key={h} className={h === "Total" ? "num" : undefined}>{h}</th>)}</tr></thead>
            <tbody>{pv.sample.map((r) => (
              <tr key={String(r[0])}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{fmtDate(String(r[3]))}</td><td><Pill s={String(r[4])} /></td><td className="num">{peso(Number(r[5]))}</td></tr>
            ))}</tbody>
          </table></div>
          {count > 5 ? <p className="muted" style={{ fontSize: ".82rem", marginTop: -8 }}>Showing the first 5. The file has all {count}, with every column.</p> : null}
        </>
      ) : null}
      {err ? <em className="err">{err}</em> : null}
      <p className="muted" style={{ fontSize: ".84rem" }}>Every export is recorded in the Activity Log.</p>
      <div className="row"><button className="btn btn-lime" type="submit" disabled={!count}>⤓ Download .xlsx</button><button className="btn btn-ghost" type="button" data-close="1">Cancel</button></div>
    </form>
  );
}
