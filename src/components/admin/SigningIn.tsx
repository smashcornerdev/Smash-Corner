"use client";

import { useEffect } from "react";

/* Shown on the sign-in page once Clerk has accepted the sign-in (spec §7 Access).
   Clerk moves to the console on its own; if that hasn't happened after a few
   seconds, a full page load is forced so the admin is never left on a blank page. */
export default function SigningIn() {
  useEffect(() => {
    const t = setTimeout(() => window.location.assign("/admin"), 6000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="badge" role="status" aria-live="polite"><div className="in" style={{ alignItems: "center", textAlign: "center" }}>
      <span className="signin-spin" aria-hidden="true" />
      <h1 style={{ fontSize: "1.1rem" }}>Signing you in…</h1>
      <p className="muted" style={{ fontSize: ".88rem" }}>Opening the admin console.</p>
    </div></div>
  );
}
