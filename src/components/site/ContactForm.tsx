"use client";
import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import { sendContact, type ContactState } from "@/app/actions/contact";
import { paperPlaneSend, receiptOpen, reducedMotion } from "@/lib/gsap/paperPlane";

type Box = { top: number; left: number; width: number; height: number };

/* Contact form (spec §2 Contact). Once the server has the message (v5.45): it's printed on a sheet, folded into a paper plane
   that flies into the Send button, and the button opens into a receipt (GSAP paperPlane). Reduced motion: straight to the
   receipt. "Write another" brings back an empty form. */
export default function ContactForm() {
  const [round, setRound] = useState(0);
  return <ContactCard key={round} onAgain={() => setRound((r) => r + 1)} />;
}

function ContactCard({ onAgain }: { onAgain: () => void }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { ok: false });
  const [phase, setPhase] = useState<"form" | "flying" | "sent">("form");
  const card = useRef<HTMLDivElement>(null), field = useRef<HTMLTextAreaElement>(null), btn = useRef<HTMLButtonElement>(null), receipt = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState({ text: "", subject: "", email: "", at: "" });
  const from = useRef<{ box: Box; h: number } | null>(null);

  // the form clears itself after the action, so keep what was sent for the sheet and the receipt
  const send = (fd: FormData) => {
    setSent({
      text: String(fd.get("message") ?? ""), subject: String(fd.get("subject") ?? ""), email: String(fd.get("email") ?? ""),
      at: new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }),
    });
    return action(fd);
  };

  useEffect(() => {
    if (!state.ok) return;
    const c = card.current, f = field.current, b = btn.current;
    if (reducedMotion() || !c || !f || !b) { setPhase("sent"); return; }
    setPhase("flying");
    return paperPlaneSend({
      card: c, field: f, button: b, text: sent.text,
      done: () => {
        const cr = c.getBoundingClientRect(), br = b.getBoundingClientRect();
        from.current = { box: { top: br.top - cr.top, left: br.left - cr.left, width: br.width, height: br.height }, h: c.offsetHeight };
        setPhase("sent");
      },
    });
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (phase === "sent" && from.current && card.current && receipt.current) receiptOpen(card.current, receipt.current, from.current.box, from.current.h);
  }, [phase]);

  return (
    <div className="card contact-card" ref={card} style={{ padding: 24 }}>
      {phase === "sent" ? (
        <div className="pp-receipt stack" ref={receipt} role="status">
          <p className="eyebrow">Message sent</p>
          <div className="pp-to"><span className="pp-av" aria-hidden="true">SC</span><div><small className="muted">Sent to</small><b>Smash Corner front desk</b></div></div>
          <p className="muted">We read every message and reply by email, usually within a day. Keep an eye on your inbox.</p>
          <dl className="pp-lines">
            {sent.subject ? <div><dt>Subject</dt><dd>{sent.subject}</dd></div> : null}
            {sent.email ? <div><dt>Reply to</dt><dd>{sent.email}</dd></div> : null}
            {sent.at ? <div><dt>Sent</dt><dd>{sent.at}</dd></div> : null}
          </dl>
          <div className="row"><button type="button" className="btn btn-ghost" onClick={onAgain}>Write another</button></div>
        </div>
      ) : (
        <form action={send} className="stack" aria-busy={phase === "flying" || undefined}>
          <div className="form-grid">
            <label className="f"><span>Name</span><input className="inp" name="name" required autoComplete="name" /></label>
            <label className="f"><span>Email</span><input className="inp" name="email" type="email" required autoComplete="email" /></label>
            <label className="f full"><span>Subject</span>
              <select className="inp" name="subject">
                <option>Cancel or reschedule a booking</option><option>Programs &amp; coaching</option><option>Events</option><option>Other</option>
              </select>
            </label>
            <label className="f full"><span>Message</span><textarea className="inp" name="message" required ref={field} /></label>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999 }} />
          </div>
          {state.error ? <p className="err">{state.error}</p> : null}
          <button ref={btn} className="btn btn-lime no-edge" type="submit" disabled={pending || phase === "flying"} style={{ alignSelf: "flex-start" }}>
            {pending || phase === "flying" ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
