"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { registerClassAction } from "@/app/actions/booking";
import { peso, validEmail, validPhone } from "@/lib/format";
import { fmtDateLong, fmtH, fmtTs, parseKey } from "@/lib/time";

export type BookableClass = {
  id: string; title: string; court: string; date: string; start: number; end: number; deadline: string; fee: number;
  rentalFee: number | null; rentalLeft: number; rentalItem: string; seatsLeft: number; capacity: number; full: boolean;
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* Book page → Class / event tab (spec §6): one participant per registration, no payment until approved. */
export default function ClassRegistration({ classes }: { classes: BookableClass[] }) {
  const open = classes.filter((c) => !c.full);
  const [sel, setSel] = useState<string | null>(open.length === 1 ? open[0].id : null);
  const [rent, setRent] = useState<"yes" | "no" | null>(null);
  const [f, setF] = useState({ name: "", nickname: "", age: "", email: "", phone: "" });
  const [agree, setAgree] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState("");
  const [done, setDone] = useState<{ ref: string; email: string; k: BookableClass } | null>(null);
  const [pending, start] = useTransition();
  const k = classes.find((c) => c.id === sel && !c.full) ?? null;

  if (!classes.length) {
    return (
      <div className="panel" style={{ marginBottom: 60 }}>
        <div className="empty">
          <b style={{ fontFamily: "var(--display)", fontSize: "1.1rem", color: "var(--fg)" }}>Class registration is closed</b>
          <p>No classes or events are open for registration right now. Please check back soon.</p>
          <div className="row" style={{ justifyContent: "center" }}><Link href="/book" className="btn btn-lime">Book a court instead</Link><Link href="/programs" className="btn btn-ghost">See our programs</Link></div>
        </div>
      </div>
    );
  }
  if (done) {
    return (
      <div className="panel" style={{ marginBottom: 60 }}>
        <p className="eyebrow">Submitted</p><h2>Registration received</h2>
        <div className="refs"><span className="ref">{done.ref}</span></div>
        <p className="lead">Your registration for <b>{done.k.title}</b> ({fmtDateLong(done.k.date)}, {fmtH(done.k.start)} – {fmtH(done.k.end)}) is <span className="pill pending">Pending</span>. An admin will review it and email you at <b>{done.email}</b> with the payment details once it is approved. You will then have <b>24 hours</b> to pay to keep your slot.</p>
        <div className="banner">To cancel your registration, <Link href="/contact">contact us</Link>. Online cancellation is not available.</div>
        <div className="row"><button className="btn btn-ghost" onClick={() => { setDone(null); setF({ ...f, name: "", nickname: "", age: "" }); setAgree(false); }}>Register someone else</button></div>
      </div>
    );
  }
  const total = k ? k.fee + (rent === "yes" && k.rentalFee != null ? k.rentalFee : 0) : 0;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!k) return;
    const er: Record<string, string> = {};
    const age = parseInt(f.age, 10);
    if (!f.name.trim()) er.name = "Enter your full name.";
    if (!f.nickname.trim()) er.nickname = "Enter a nickname.";
    if (!(age >= 1 && age <= 100 && String(age) === f.age.trim())) er.age = "Enter your age as a number.";
    if (!validEmail(f.email.trim())) er.email = "Enter a valid email address.";
    if (!validPhone(f.phone)) er.phone = "Enter a valid mobile number, e.g. 0917 123 4567.";
    if (k.rentalFee != null && !rent) er.rent = "Choose Yes or No.";
    if (!agree) er.agree = "You need to agree to the policy to register.";
    setErrs(er); setFormErr("");
    if (Object.keys(er).length) return;
    start(async () => {
      const r = await registerClassAction({ classId: k.id, name: f.name.trim(), nickname: f.nickname.trim(), age, email: f.email.trim(), phone: f.phone.trim(), rent: rent === "yes" });
      if (!r.ok) setFormErr(r.error ?? "Something went wrong.");
      else { setDone({ ref: r.ref!, email: r.email!, k }); window.scrollTo(0, 0); }
    });
  };
  const inp = (id: keyof typeof f, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="f"><span>{label}</span><input className="inp" value={f[id]} onChange={(e) => setF({ ...f, [id]: e.target.value })} {...extra} />{errs[id] ? <em className="err">{errs[id]}</em> : null}</label>
  );
  return (
    <div className="book-grid">
      <div className="stack">
        <div className="panel">
          <h2 style={{ fontSize: "1.3rem" }}>Choose a class</h2>
          <div className="cls-list">
            {classes.map((c) => {
              const d = parseKey(c.date);
              return (
                <button key={c.id} type="button" className={"cls-card" + (sel === c.id ? " sel" : "")} disabled={c.full} aria-pressed={sel === c.id} onClick={() => { setSel(c.id); setRent(null); }}>
                  <span className="cls-date clip"><small>{MONTHS[d.m - 1]}</small><b>{d.d}</b></span>
                  <span className="stack" style={{ gap: 4, minWidth: 0 }}>
                    <span className="cls-t">{c.title}</span>
                    <span style={{ fontSize: ".9rem" }}>{c.court} · {fmtDateLong(c.date)} · {fmtH(c.start)} – {fmtH(c.end)}</span>
                    <small className="muted">Register by {fmtTs(c.deadline)}{c.rentalFee != null ? ` · ${c.rentalItem} rental available` : ""}</small>
                  </span>
                  <span className="cls-r"><b className="lime tabnum">{peso(c.fee)}</b><small>{c.full ? "Full" : `${c.seatsLeft} of ${c.capacity} slots left`}</small></span>
                </button>
              );
            })}
          </div>
        </div>
        {k ? (
          <form className="panel" onSubmit={submit} noValidate>
            <h2 style={{ fontSize: "1.3rem" }}>Your details</h2>
            <p className="muted" style={{ fontSize: ".88rem", marginTop: -8 }}>Registering for <b style={{ color: "var(--fg)" }}>{k.title}</b>. One registration per participant.</p>
            <div className="form-grid">
              {inp("name", "Full name", { autoComplete: "name" })}
              {inp("nickname", "Nickname", { placeholder: "What should the coach call you?" })}
              {inp("age", "Age", { type: "number", min: 1, max: 100, inputMode: "numeric" })}
              {inp("email", "Email", { type: "email", autoComplete: "email" })}
              {inp("phone", "Contact number", { type: "tel", autoComplete: "tel", placeholder: "0917 123 4567" })}
            </div>
            {k.rentalFee != null ? (
              <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
                <legend style={{ fontWeight: 600, marginBottom: 6 }}>Rent a {k.rentalItem.toLowerCase()}?</legend>
                <p className="muted" style={{ fontSize: ".86rem", marginBottom: 10 }}>{peso(k.rentalFee)} for the whole class · {k.rentalLeft ? `${k.rentalLeft} left` : "none left, please bring your own"}</p>
                <div className="seg">
                  <label><input type="radio" name="rRent" checked={rent === "yes"} disabled={!k.rentalLeft} onChange={() => setRent("yes")} /> Yes, rent one</label>
                  <label><input type="radio" name="rRent" checked={rent === "no"} onChange={() => setRent("no")} /> No, I will bring my own</label>
                </div>
                {errs.rent ? <em className="err">{errs.rent}</em> : null}
              </fieldset>
            ) : <div className="banner">This class has no {k.rentalItem.toLowerCase()} rentals. Please bring your own.</div>}
            <div className="banner" style={{ fontSize: ".88rem" }}>No payment yet. Once an admin approves your registration, we email you the payment details and you have 24 hours to pay.</div>
            <div className="stack" style={{ gap: 6 }}>
              <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>I agree to the <Link href="/policy">Booking & Refund Policy</Link>.</span></label>
              {errs.agree ? <em className="err">{errs.agree}</em> : null}
            </div>
            {formErr ? <p className="err">{formErr}</p> : null}
            <div className="row"><button className="btn btn-lime" type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit registration"}</button></div>
          </form>
        ) : null}
      </div>
      <aside className="summary">
        <h4>Registration summary</h4>
        {k ? (
          <>
            <div className="line"><span>Class</span><span style={{ textAlign: "right" }}>{k.title}</span></div>
            <div className="line"><span>Court</span><span>{k.court}</span></div>
            <div className="line"><span>Date</span><span>{fmtDateLong(k.date)}</span></div>
            <div className="line"><span>Time</span><span>{fmtH(k.start)} – {fmtH(k.end)}</span></div>
            <div className="line"><span>Class fee</span><span className="tabnum">{peso(k.fee)}</span></div>
            {rent === "yes" && k.rentalFee != null ? <div className="line"><span>1 × {k.rentalItem} rental</span><span className="tabnum">{peso(k.rentalFee)}</span></div> : null}
            <div className="line total"><span>Total</span><span className="tabnum">{peso(total)}</span></div>
            <p className="muted" style={{ fontSize: ".78rem" }}>Register by {fmtTs(k.deadline)}. No payment yet: you pay within 24 hours after an admin approves your registration, and your slot is confirmed once your payment is verified.</p>
          </>
        ) : <p className="muted">Choose a class to register.</p>}
      </aside>
    </div>
  );
}
