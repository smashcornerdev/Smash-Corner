"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { paymentMethodAction, reorderPaymentMethodsAction } from "@/app/actions/admin";
import { Modal } from "@/components/admin/Modal";
import { ActBtn } from "@/components/admin/ReasonForm";
import type { PaymentMethod } from "@/lib/types";

type M = Pick<PaymentMethod, "id" | "name" | "details" | "qr_url" | "active">;

/* Management → Payment Methods (spec §16; mockup vMethods): drag a card to reorder
   (mouse: the whole card; touch: the ⠿ handle; keyboard: arrow keys on the handle), Add / Edit in a modal. */
export default function PaymentMethods({ methods }: { methods: M[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(methods.map((m) => m.id));
  const [editing, setEditing] = useState<M | "new" | null>(null);
  const [toast, setToast] = useState<{ msg: string; warn?: boolean } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; y: number; moved: boolean; start: string[] } | null>(null);
  const orderRef = useRef(order);
  orderRef.current = order;

  // the server list wins after any save or refresh
  useEffect(() => { setOrder(methods.map((m) => m.id)); }, [methods]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);

  const save = async (ids: string[], before: string[], msg: string) => {
    if (ids.join() === before.join()) return;
    const r = await reorderPaymentMethodsAction(ids);
    if (r.ok) setToast({ msg });
    else { setOrder(before); setToast({ msg: r.error ?? "Couldn't save the order.", warn: true }); }
    router.refresh();
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || !list.current) return;
      if (!d.moved && Math.abs(e.clientY - d.y) < 5) return;
      if (!d.moved) { d.moved = true; setDragId(d.id); document.body.classList.add("pm-dragging"); }
      // insert before the first other card whose middle is below the pointer
      const cards = [...list.current.children].filter((c) => (c as HTMLElement).dataset.id !== d.id) as HTMLElement[];
      const before = cards.find((c) => { const r = c.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
      const rest = orderRef.current.filter((id) => id !== d.id);
      const at = before ? rest.indexOf(before.dataset.id!) : rest.length;
      const next = [...rest.slice(0, at), d.id, ...rest.slice(at)];
      if (next.join() !== orderRef.current.join()) setOrder(next);
    };
    const end = () => {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      setDragId(null);
      document.body.classList.remove("pm-dragging");
      if (d.moved) save(orderRef.current, d.start, "Order saved. Customers see the new order on the Pay page.");
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", end);
    document.addEventListener("pointercancel", end);
    return () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", end); document.removeEventListener("pointercancel", end); };
  });

  const down = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    const onHandle = !!t.closest(".pm-handle");
    if (!onHandle && (e.pointerType !== "mouse" || t.closest("button,a,input,label,form"))) return;
    e.preventDefault();
    drag.current = { id, y: e.clientY, moved: false, start: orderRef.current };
  };
  const key = (e: React.KeyboardEvent, id: string) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const i = order.indexOf(id), j = i + (e.key === "ArrowUp" ? -1 : 1);
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    next.splice(j, 0, next.splice(i, 1)[0]);
    setOrder(next);
    save(next, order, `Moved ${e.key === "ArrowUp" ? "up" : "down"}.`);
  };

  const byId = new Map(methods.map((m) => [m.id, m]));
  const shown = order.map((id) => byId.get(id)).filter((m): m is M => !!m);
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <p className="muted" style={{ maxWidth: "68ch" }}>These are the payment options customers see on the Pay page, in this order. <b>Drag a payment method to change the order.</b> Each has a name, payment details (account name, number, instructions) and an optional QR code image. Hidden methods stay saved but customers can&apos;t choose them.</p>
        <button type="button" className="btn btn-lime" onClick={() => setEditing("new")}>+ Add payment method</button>
      </div>
      {shown.length ? (
        <div className="pm-list" ref={list}>
          {shown.map((m) => (
            <article key={m.id} data-id={m.id} className={"pm-card" + (m.active ? "" : " off") + (dragId === m.id ? " dragging" : "")} onPointerDown={(e) => down(e, m.id)}>
              <button type="button" className="pm-handle" aria-label={`Reorder ${m.name}: drag, or press the up and down arrow keys`} title="Drag to reorder" onKeyDown={(e) => key(e, m.id)}>⠿</button>
              {m.qr_url ? <img className="pm-qr" src={m.qr_url} alt={`${m.name} QR code`} draggable={false} /> : <div className="pm-qr none">No QR</div>}
              <div className="stack" style={{ gap: 6, minWidth: 0 }}>
                <div className="row" style={{ gap: 8 }}><h3>{m.name}</h3>{m.active ? <span className="pill approved">shown</span> : <span className="pill expired">hidden</span>}</div>
                <div className="pm-details">{m.details}</div>
              </div>
              <div className="acts pm-acts">
                <button type="button" className="btn btn-lav btn-sm" onClick={() => setEditing(m)}>Edit</button>
                <ActBtn action={paymentMethodAction} fields={{ id: m.id, op: "toggle" }} label={m.active ? "Hide" : "Show"} cls="btn-ghost" />
                <ActBtn action={paymentMethodAction} fields={{ id: m.id, op: "delete" }} label="Delete" cls="btn-danger" />
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty">No payment methods yet. Customers can&apos;t pay until you add one.</div>}
      {editing ? (
        <Modal eyebrow="Payment methods" title={editing === "new" ? "Add payment method" : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <MethodForm m={editing === "new" ? undefined : editing} />
        </Modal>
      ) : null}
      {toast ? <div id="toasts" aria-live="polite"><div className={"toast" + (toast.warn ? " warn" : "")}>{toast.msg}</div></div> : null}
    </>
  );
}

function Submit({ label }: { label: string }) { const { pending } = useFormStatus(); return <button className="btn btn-lime" type="submit" disabled={pending}>{pending ? "Saving…" : label}</button>; }

function MethodForm({ m }: { m?: M }) {
  const [qr, setQr] = useState<string | null>(m?.qr_url ?? null);
  const [removed, setRemoved] = useState(false);
  const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const pick = (f: File | undefined) => {
    setErr("");
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { setErr("Upload a PNG, JPG or WebP image."); if (file.current) file.current.value = ""; return; }
    if (f.size > 5 * 1024 * 1024) { setErr("That image is over 5 MB. Upload a smaller one."); if (file.current) file.current.value = ""; return; }
    setQr(URL.createObjectURL(f));
    setRemoved(false);
  };
  const remove = () => { setQr(null); setRemoved(true); if (file.current) file.current.value = ""; };
  return (
    <form action={paymentMethodAction} className="stack">
      {m ? <input type="hidden" name="id" value={m.id} /> : null}
      {removed && m?.qr_url ? <input type="hidden" name="removeQr" value="on" /> : null}
      <label className="f"><span>Name</span><input className="inp" name="name" maxLength={40} defaultValue={m?.name} required placeholder="e.g. GCash" autoFocus /></label>
      <label className="f"><span>Details (shown to customers)</span><textarea className="inp" name="details" rows={4} defaultValue={m?.details} required placeholder={"Account name: …\nAccount number: …\nInstructions: …"} /></label>
      <div className="stack" style={{ gap: 8 }}>
        <span style={{ fontSize: ".86rem", fontWeight: 500 }}>QR code image (optional)</span>
        <div className="pm-upload">
          {qr ? <img className="pm-qr" src={qr} alt="QR code preview" /> : <div className="pm-qr none">No QR</div>}
          <div className="stack" style={{ gap: 8 }}>
            <label className="btn btn-ghost btn-sm" htmlFor="pmQrIn">{qr ? "Replace image" : "Upload image"}</label>
            <input type="file" id="pmQrIn" name="qr" ref={file} accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
            {qr ? <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={remove}>Remove QR code</button> : null}
            <span className="muted" style={{ fontSize: ".8rem" }}>PNG, JPG or WebP, max 5 MB. Use the QR exported from the bank or e-wallet app.</span>
            {err ? <em className="err">{err}</em> : null}
          </div>
        </div>
      </div>
      <label className="check"><input type="checkbox" name="active" defaultChecked={m ? m.active : true} /><span>Show to customers on the Pay page</span></label>
      <div className="row"><Submit label={m ? "Save changes" : "Add payment method"} /><button className="btn btn-ghost" type="button" data-close="1">Cancel</button></div>
    </form>
  );
}
