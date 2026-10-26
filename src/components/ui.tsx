import type { ReactNode } from "react";
import { ST_LABEL } from "@/lib/types";

export function PageTop({ eyebrow, title, lead }: { eyebrow: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <section className="wrap page-top">
      <p className="eyebrow">{eyebrow}</p>
      <h1 style={{ marginTop: 10 }}>{title}</h1>
      {lead ? <p className="lead">{lead}</p> : null}
    </section>
  );
}

export function SecHead({ eyebrow, title, lead, action, id, style }: { eyebrow: string; title: string; lead?: ReactNode; action?: ReactNode; id?: string; style?: React.CSSProperties }) {
  return (
    <div className="sec-head" id={id} style={style}>
      <div className="stack">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {lead ? <p className="lead">{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** status sticker (spec §14 Admin Console Status Colors) */
export function Pill({ s, label }: { s: string; label?: string }) {
  return <span className={"pill " + s}>{label ?? ST_LABEL[s] ?? s}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
