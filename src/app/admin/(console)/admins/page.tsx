import { requireAdmin } from "@/lib/auth";
import { db, must } from "@/lib/supabase";
import type { Admin } from "@/lib/types";

/* Admin Accounts (super-admins, spec §7 Access): access is given by email on this list */
export default async function AdminsPage() {
  const me = await requireAdmin({ superOnly: true });
  const list = must(await db().from("admins").select("email, name, role").order("role", { ascending: false }).order("name")) as Admin[];
  return (
    <>
      <p className="muted" style={{ maxWidth: "70ch" }}>Admin access is given by email: anyone who signs in (Clerk) with a verified email on this list gets the console with its role; every other account is refused. All admins receive every notification email. <b>Super-admins</b> see everything. <b>Admins</b> manage bookings: Dashboard, Court Bookings, Classes &amp; Events and Calendar. To add, remove or change an admin, edit the <code>admins</code> table in Supabase; it takes effect on the next request.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Notification emails</th></tr></thead>
          <tbody>{list.map((a) => <tr key={a.email}><td>{a.name}{a.email === me.email ? <> <span className="pill waiting">you</span></> : null}</td><td>{a.email}</td><td>{a.role === "super_admin" ? "Super-admin" : "Admin"}</td><td className="lime">On</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
