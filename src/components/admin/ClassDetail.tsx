import "server-only";
import { RegTable } from "@/components/admin/RegTable";
import { ActBtn } from "@/components/admin/ReasonForm";
import { classStatusAction } from "@/app/actions/admin";
import { fmtDateLong, fmtH } from "@/lib/time";
import type { ClassReg, ClassRow } from "@/lib/types";

/** One class: its registrations + Cancel class (spec §7). Used by the class page (/admin/classes/class/[id]) and, since v5.86,
 *  by the card behind Registration Controls' "Registrations (n)" and "Cancel class" buttons (`card`: plain sections inside the
 *  card, title in the card's head). `back`: where the registration actions return to. */
export default function ClassDetail({ k, regs, courtName, back, card }: { k: ClassRow; regs: ClassReg[]; courtName?: string; back: string; card?: boolean }) {
  const live = regs.filter((r) => ["pending", "awaiting", "verify", "approved"].includes(r.status));
  return (
    <>
      <div className={card ? "stack bd-sec" : "stack"}>
        {card ? null : <h2 style={{ fontSize: "1.2rem" }}>{k.title}</h2>}
        <p className="muted">{courtName} · {fmtDateLong(k.date)} · {fmtH(k.start_hour)} – {fmtH(k.end_hour)} · {live.length} of {k.capacity} slots taken</p>
        <RegTable regs={regs} classes={[k]} back={back} showClass={false} />
      </div>
      {k.status !== "cancelled" ? (
        <div className={card ? "stack bd-sec" : "panel"} id="cancel">
          <h3>Cancel &quot;{k.title}&quot;</h3>
          <p>{live.length ? <><b className="lime">{live.length} registration{live.length > 1 ? "s" : ""} will be cancelled</b>. Everyone who paid gets a 100% refund, and each participant is emailed.</> : "No one has registered yet."} The court becomes bookable again.</p>
          <div className="row"><ActBtn action={classStatusAction} fields={{ id: k.id, op: "cancel" }} label="Cancel class" cls="btn-danger" small={false} trace /></div>
        </div>
      ) : null}
    </>
  );
}
