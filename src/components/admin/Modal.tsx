"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cardIn, cardOut } from "@/lib/gsap/cardIn";
import { useSearchParams } from "next/navigation";

/* Admin modal (mockup openOverlay): a button opens it; ×, Esc, the backdrop or any [data-close] button closes it.
   After a form inside it is submitted, the action's ?msg banner closes it on success and shows the error inside on failure. */
/** `trace`: the hover border trace on the button; `intro` / `outro`: the window's opening (v5.77) and closing (v5.79) animations (Export to Excel) */
export default function ModalButton({ label, ariaLabel, cls = "btn-lime", eyebrow, title, wide, trace, intro, outro, children }: {
  label: React.ReactNode; ariaLabel?: string; cls?: string; eyebrow: string; title: string; wide?: boolean; trace?: boolean; intro?: boolean; outro?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={"btn " + cls} onClick={() => setOpen(true)} aria-label={ariaLabel} data-trace={trace || undefined}>{label}</button>
      {open ? <Modal eyebrow={eyebrow} title={title} wide={wide} intro={intro} outro={outro} onClose={() => setOpen(false)}>{children}</Modal> : null}
    </>
  );
}

/** `intro`: play the opening animation (v5.75 booking cards; v5.77 Export to Excel). `outro`: play the closing animation before
 *  `onClose` (v5.79 Export to Excel; v5.87 booking / class cards). `leave`: the card was closed from outside (browser Back, an
 *  action's redirect): play the closing animation now, then `onClose`; set back to false (reopened), it plays the opening again. */
export function Modal({ eyebrow, title, wide, intro, outro, leave, onClose, children }: { eyebrow: string; title: React.ReactNode; wide?: boolean; intro?: boolean; outro?: boolean; leave?: boolean; onClose: () => void; children: React.ReactNode }) {
  const sp = useSearchParams();
  const msg = sp.get("msg"), kind = sp.get("k"), nonce = sp.get("n");
  const sent = useRef<string | null | undefined>(undefined); // the ?n seen when the form was submitted
  const [err, setErr] = useState("");
  const ov = useRef<HTMLDivElement>(null), box = useRef<HTMLDivElement>(null);
  const closing = useRef(false); // on its way out (closing animation playing)
  // before paint, so the card never shows for a frame before animating; off with reduced motion
  useLayoutEffect(() => {
    if (!intro || leave || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    closing.current = false; // reopened while on its way out: it can close again
    const tl = cardIn(ov.current!, box.current!);
    return () => { tl.kill(); };
  }, [intro, leave]);
  useLayoutEffect(() => {
    if (!leave) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onClose(); return; }
    closing.current = true;
    const tl = cardOut(ov.current!, box.current!, onClose);
    return () => { tl.kill(); };
  }, [leave]); // eslint-disable-line react-hooks/exhaustive-deps
  // with `outro`, every way of closing (×, Cancel, Esc, backdrop, a successful submit) plays the closing animation first
  const close = useCallback(() => {
    if (!outro || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onClose();
    if (closing.current) return; // already on its way out
    closing.current = true;
    cardOut(ov.current!, box.current!, onClose);
  }, [outro, onClose]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    const y = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = y; };
  }, [close]);
  useEffect(() => {
    if (sent.current === undefined || nonce === sent.current) return;
    sent.current = undefined;
    if (kind === "err") setErr(msg ?? "");
    else close();
  }, [nonce, msg, kind, close]);
  return (
    <div ref={ov} className="overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).closest("[data-close]")) close(); }}>
      <div ref={box} className={"modal" + (wide ? " wide" : "")} onSubmitCapture={() => { sent.current = nonce; setErr(""); }}>
        <div className="modal-head">
          <div><p className="eyebrow">{eyebrow}</p><h2 id="modal-title" style={{ fontSize: "1.2rem", marginTop: 6 }}>{title}</h2></div>
          <button type="button" className="x" aria-label="Close" data-close="1">×</button>
        </div>
        {err ? <div className="banner err" role="alert">{err}</div> : null}
        {children}
      </div>
    </div>
  );
}
