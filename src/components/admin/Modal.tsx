"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

/* Admin modal (mockup openOverlay): a button opens it; ×, Esc, the backdrop or any [data-close] button closes it.
   After a form inside it is submitted, the action's ?msg banner closes it on success and shows the error inside on failure. */
export default function ModalButton({ label, cls = "btn-lime", eyebrow, title, wide, children }: {
  label: React.ReactNode; cls?: string; eyebrow: string; title: string; wide?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={"btn " + cls} onClick={() => setOpen(true)}>{label}</button>
      {open ? <Modal eyebrow={eyebrow} title={title} wide={wide} onClose={() => setOpen(false)}>{children}</Modal> : null}
    </>
  );
}

export function Modal({ eyebrow, title, wide, onClose, children }: { eyebrow: string; title: string; wide?: boolean; onClose: () => void; children: React.ReactNode }) {
  const sp = useSearchParams();
  const msg = sp.get("msg"), kind = sp.get("k"), nonce = sp.get("n");
  const sent = useRef<string | null | undefined>(undefined); // the ?n seen when the form was submitted
  const [err, setErr] = useState("");
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const y = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = y; };
  }, [onClose]);
  useEffect(() => {
    if (sent.current === undefined || nonce === sent.current) return;
    sent.current = undefined;
    if (kind === "err") setErr(msg ?? "");
    else onClose();
  }, [nonce, msg, kind, onClose]);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).closest("[data-close]")) onClose(); }}>
      <div className={"modal" + (wide ? " wide" : "")} onSubmitCapture={() => { sent.current = nonce; setErr(""); }}>
        <div className="modal-head">
          <div><p className="eyebrow">{eyebrow}</p><h2 id="modal-title" style={{ fontSize: "1.2rem", marginTop: 6 }}>{title}</h2></div>
          <button type="button" className="x" aria-label="Close" data-close="1">×</button>
        </div>
        {err ? <div className="banner" role="alert" style={{ borderLeftColor: "var(--error)" }}>{err}</div> : null}
        {children}
      </div>
    </div>
  );
}
