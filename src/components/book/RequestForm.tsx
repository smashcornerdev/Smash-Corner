"use client";
import { useActionState } from "react";
import Link from "next/link";
import { submitRequestAction, type ActionResult } from "@/app/actions/booking";
import { confettiBurst } from "@/lib/gsap/confetti";

export default function RequestForm({ free }: { free: boolean }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(submitRequestAction, { ok: false });
  return (
    <form className="panel" action={action}>
      {free ? <div className="banner lime"><b>₱0 to pay.</b> This booking costs nothing, so no payment or receipt is needed.</div> : null}
      <div className="stack" style={{ gap: 10 }}>
        <h3>How it works</h3>
        <ol className="muted" style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 22, margin: 0, listStyle: "decimal" }}>
          <li>Send your request. Your time is held while we review it (within 24 hours, usually much sooner).</li>
          {free ? <li>We email you once it&apos;s approved. Nothing to pay, so it&apos;s confirmed straight away.</li> : (
            <>
              <li>Once it&apos;s approved, we email you the amount and payment details.</li>
              <li>Pay within <b>24 hours</b> and upload your receipt on the payment page.</li>
              <li>We verify your payment and email your confirmation.</li>
            </>
          )}
        </ol>
      </div>
      <div className="stack" style={{ gap: 10 }}>
        <h3>Confirm</h3>
        <label className="check"><input type="checkbox" name="agree" /><span>I agree to the <Link href="/policy">Booking & Refund Policy</Link>.</span></label>
      </div>
      {state.error ? <em className="err">{state.error}</em> : null}
      <div className="row">
        {/* confetti (GSAP confettiBurst, v5.43) when the request is sent off; not when the policy box is still unticked, since
            that click only shows an error. The pieces live on <body>, so they keep falling over the confirmation page */}
        <button className="btn btn-lime no-edge" type="submit" disabled={pending}
          onClick={(e) => { if (e.currentTarget.form?.querySelector<HTMLInputElement>("input[name=agree]")?.checked) confettiBurst(e.currentTarget); }}>
          {pending ? "Sending…" : "Send booking request"}
        </button>
        <Link href="/cart" className="btn btn-ghost">Back to cart</Link>
      </div>
    </form>
  );
}
