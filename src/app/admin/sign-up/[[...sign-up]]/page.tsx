import { SignUp } from "@clerk/nextjs";

/* Accept an admin invitation (sign-ups are restricted to invited admin emails, spec §7 Access).
   Clerk's invitation email links here with a ticket; without one, sign-up is refused. */
export default function AdminSignUp() {
  return (
    <div className="login">
      <SignUp routing="path" path="/admin/sign-up" signInUrl="/admin/sign-in" forceRedirectUrl="/admin" />
    </div>
  );
}
