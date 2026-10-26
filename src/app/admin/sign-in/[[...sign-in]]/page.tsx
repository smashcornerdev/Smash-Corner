import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Arrow } from "@/components/art";

/* Admin sign in (Clerk). Only emails on the admin list get into the console (spec §7 Access). */
export default function AdminSignIn() {
  return (
    <div className="login">
      <div className="stack" style={{ alignItems: "center" }}>
        <SignIn routing="path" path="/admin/sign-in" forceRedirectUrl="/admin" />
        <Link href="/" style={{ fontSize: ".88rem" }}><Arrow dir="l" /> Back to website</Link>
      </div>
    </div>
  );
}
