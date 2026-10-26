"use client";
import { useRef } from "react";
import { useFormStatus } from "react-dom";

function Submit({ label, cls }: { label: string; cls: string }) {
  const { pending } = useFormStatus();
  return <button className={"btn " + cls} type="submit" disabled={pending}>{pending ? "Working…" : label}</button>;
}

/* reject / cancel with a reason; chips fill the reason in (spec §11 rec. 5: optional when rejecting, required when cancelling) */
export default function ReasonForm({ action, id, back, label, required, chips, note, children, danger = true }: {
  action: (fd: FormData) => Promise<void>; id: string; back: string; label: string; required?: boolean; chips: string[]; note?: string; children?: React.ReactNode; danger?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <form action={action} className="stack" style={{ gap: 12 }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={back} />
      <label className="f"><span>{required ? "Reason (sent to the customer)" : "Reason (optional, sent to the customer)"}</span>
        <textarea className="inp" name="reason" ref={ref} required={required} minLength={required ? 4 : undefined} />
      </label>
      <div className="chips">{chips.map((c) => <button type="button" className="chip" key={c} onClick={() => { if (ref.current) ref.current.value = c; }}>{c}</button>)}</div>
      {children}
      {note ? <p className="muted" style={{ fontSize: ".86rem" }}>{note}</p> : null}
      <div className="row"><Submit label={label} cls={danger ? "btn-danger" : "btn-lime"} /></div>
    </form>
  );
}

/** one-click form button (approve / confirm / notify …) */
export function ActBtn({ action, fields, label, cls = "btn-ok", small = true }: { action: (fd: FormData) => Promise<void>; fields: Record<string, string>; label: string; cls?: string; small?: boolean }) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Submit label={label} cls={cls + (small ? " btn-sm" : "")} />
    </form>
  );
}
