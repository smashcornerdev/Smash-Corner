"use client";
import { useActionState } from "react";
import { sendContact, type ContactState } from "@/app/actions/contact";

export default function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { ok: false });
  if (state.ok) {
    return (
      <div className="stack card" style={{ padding: 24 }}>
        <h3>Message sent</h3>
        <p className="muted">Thanks! We will reply by email.</p>
      </div>
    );
  }
  return (
    <form action={action} className="stack card" style={{ padding: 24 }}>
      <div className="form-grid">
        <label className="f"><span>Name</span><input className="inp" name="name" required autoComplete="name" /></label>
        <label className="f"><span>Email</span><input className="inp" name="email" type="email" required autoComplete="email" /></label>
        <label className="f full"><span>Subject</span>
          <select className="inp" name="subject">
            <option>Cancel or reschedule a booking</option><option>Programs &amp; coaching</option><option>Events</option><option>Other</option>
          </select>
        </label>
        <label className="f full"><span>Message</span><textarea className="inp" name="message" required /></label>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999 }} />
      </div>
      {state.error ? <p className="err">{state.error}</p> : null}
      <button className="btn btn-lime" type="submit" disabled={pending} style={{ alignSelf: "flex-start" }}>{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
