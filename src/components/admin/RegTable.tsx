import { Fragment } from "react";
import Link from "next/link";
import DataTable, { type Row } from "./DataTable";
import { ActBtn } from "./ReasonForm";
import { Pill } from "@/components/ui";
import { approveRegAction } from "@/app/actions/admin";
import { peso } from "@/lib/format";
import { ago, fmtDate, fmtH, fmtTs } from "@/lib/time";
import type { ClassReg, ClassRow } from "@/lib/types";

/* class registrations list (spec §7 Classes & Events) */
export function RegTable({ regs, classes, back, showClass = true }: { regs: ClassReg[]; classes: ClassRow[]; back: string; showClass?: boolean }) {
  const kOf = (r: ClassReg) => classes.find((k) => k.id === r.class_id)!;
  const rows: Row[] = regs.map((r) => {
    const k = kOf(r);
    const hist = ["rejected", "cancelled", "unpaid"].includes(r.status);
    return {
      key: r.id, search: `${r.ref} ${r.name} ${r.nickname} ${r.email} ${r.phone} ${k.title}`,
      cells: [
        <b key="r">{r.ref}</b>,
        ...(showClass ? [<Fragment key="k">{k.title}<br /><small className="muted">{fmtDate(k.date)} · {fmtH(k.start_hour)} – {fmtH(k.end_hour)}</small></Fragment>] : []),
        <Fragment key="n">{r.name}<br /><small className="muted">&quot;{r.nickname}&quot; · age {r.age}</small></Fragment>,
        <small key="c">{r.email}<br />{r.phone}</small>,
        <small key="rent">{r.rent ? "1 rental" : "None"}</small>,
        <Fragment key="m">{r.method_name ?? "Not paid yet"}<br /><small className="muted">{r.status === "awaiting" && r.pay_due_at ? `Due ${fmtTs(r.pay_due_at)}` : r.pay_ref ?? ""}</small></Fragment>,
        peso(r.total),
        hist ? <small key="s" style={{ maxWidth: 220, display: "block" }}>{r.reason || "—"}{r.refund_pct != null ? <><br />Refund: {r.refund_pct}%</> : null}</small>
          : <Fragment key="s"><Pill s={r.status} /><br /><small className="muted">{ago(r.created_at)}</small></Fragment>,
        <div className="acts" key="a">
          <Link className="btn btn-ghost btn-sm" href={`/admin/classes/reg/${r.id}`}>View</Link>
          {r.status === "pending" || r.status === "verify" ? (
            <><ActBtn action={approveRegAction} fields={{ id: r.id, back }} label={r.status === "verify" ? "Confirm payment" : "Approve"} />
              <Link className="btn btn-danger btn-sm" href={`/admin/classes/reg/${r.id}#reject`}>Reject</Link></>
          ) : null}
        </div>,
      ],
    };
  });
  const head = ["Ref", ...(showClass ? ["Class"] : []), "Participant", "Contact", "Rental", "Payment", "Total", "Status", "Actions"];
  return <DataTable head={head} rows={rows} num={[showClass ? 6 : 5]} />;
}
