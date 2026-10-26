import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

export default function NoAccess() {
  return (
    <div className="login">
      <div className="badge"><div className="in">
        <h1 style={{ fontSize: "1.3rem" }}>No admin access</h1>
        <p className="muted">This account doesn&apos;t have admin access. Only emails on the admin list can open the console. Sign in with your admin email, or ask a super-admin to add you.</p>
        <div className="row">
          <SignOutButton redirectUrl="/admin/sign-in"><button className="btn btn-lime">Use another account</button></SignOutButton>
          <Link href="/" className="btn btn-ghost">Back to website</Link>
        </div>
      </div></div>
    </div>
  );
}
