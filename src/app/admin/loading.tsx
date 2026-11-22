/* Shown right away while the admin console loads (e.g. straight after signing in), spec §7 Access */
export default function ConsoleLoading() {
  return (
    <div className="login" role="status" aria-live="polite">
      <div className="stack" style={{ alignItems: "center" }}>
        <span className="signin-spin" aria-hidden="true" />
        <p className="muted" style={{ fontSize: ".88rem" }}>Loading the admin console…</p>
      </div>
    </div>
  );
}
