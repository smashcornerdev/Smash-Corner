"use client";
import { useFormStatus } from "react-dom";
import ModalButton from "@/components/admin/Modal";
import { blacklistAction } from "@/app/actions/admin";

/* Management → Blacklist: + Add to blacklist (modal form). Spec §7, v6.13. */
function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn btn-danger" type="submit" disabled={pending} data-trace>{pending ? "Saving…" : "Add to blacklist"}</button>;
}

export function AddBlacklistButton() {
  return (
    <ModalButton label="+ Add to blacklist" eyebrow="Blacklist" title="Add to blacklist" trace intro outro>
      <form action={blacklistAction} className="stack" style={{ gap: 14 }}>
        <p className="muted" style={{ fontSize: ".86rem", margin: 0 }}>Fill in what you know; at least one is needed. A booking request that matches <b>any</b> of these details is shown in its own Blacklisted group on Court Bookings → Requests.</p>
        <label className="f"><span>Full name</span><input className="inp" name="name" maxLength={120} autoComplete="off" placeholder="e.g. Juan Dela Cruz" /></label>
        <div className="form-grid">
          <label className="f"><span>Phone number</span><input className="inp" name="phone" type="tel" maxLength={40} autoComplete="off" placeholder="0917 123 4567" /></label>
          <label className="f"><span>Email</span><input className="inp" name="email" type="email" maxLength={200} autoComplete="off" placeholder="name@example.com" /></label>
        </div>
        <label className="f"><span>Reason (optional, only admins see it)</span><textarea className="inp" name="note" maxLength={500} placeholder="e.g. No-show twice, unpaid damage" /></label>
        <div className="row"><Submit /></div>
      </form>
    </ModalButton>
  );
}
