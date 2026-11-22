import Link from "next/link";
import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { Arrow } from "@/components/art";
import SigningIn from "@/components/admin/SigningIn";

/* Admin sign in (Clerk). Only emails on the admin list get into the console (spec §7 Access).
   Once signed in, the form is swapped for a "Signing you in…" screen while the console loads. */
export default function AdminSignIn() {
  return (
    <div className="login">
      <div className="stack" style={{ alignItems: "center" }}>
        <SignedOut>
          <SignIn routing="path" path="/admin/sign-in" forceRedirectUrl="/admin" />
          <Link href="/" style={{ fontSize: ".88rem" }}><Arrow dir="l" /> Back to website</Link>
        </SignedOut>
        <SignedIn><SigningIn /></SignedIn>
      </div>
    </div>
  );
}
