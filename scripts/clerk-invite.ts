/* Invite every email on the Supabase admin list that doesn't have a Clerk account yet.
   npm run clerk:invite   (sign-ups are Restricted in Clerk, so admins join through these invitations, spec §7 Access) */
import { createClerkClient } from "@clerk/backend";
import { db } from "@/lib/supabase";

(async () => {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data: admins, error } = await db().from("admins").select("email, role");
  if (error) throw new Error(error.message);
  const pending = (await clerk.invitations.getInvitationList({ status: "pending" })).data.map((i) => i.emailAddress.toLowerCase());
  for (const a of admins as { email: string; role: string }[]) {
    const users = await clerk.users.getUserList({ emailAddress: [a.email] });
    if (users.data.length) { console.log(`${a.email}: already has a Clerk account`); continue; }
    if (pending.includes(a.email)) { console.log(`${a.email}: invitation already pending`); continue; }
    await clerk.invitations.createInvitation({ emailAddress: a.email, redirectUrl: `${site}/admin/sign-up`, notify: true, ignoreExisting: true });
    console.log(`${a.email}: invitation sent (${a.role}) → ${site}/admin/sign-up`);
  }
})().catch((e) => { console.error(e?.errors?.[0]?.longMessage ?? e?.message ?? e); process.exit(1); });
