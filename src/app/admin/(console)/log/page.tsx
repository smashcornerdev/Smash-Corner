import DataTable, { type Row } from "@/components/admin/DataTable";
import { requireAdmin } from "@/lib/auth";
import { BRANCH_ID } from "@/lib/config";
import { db, must } from "@/lib/supabase";
import { fmtTs } from "@/lib/time";

type Log = { id: number; at: string; admin_name: string; action: string; ref: string; note: string };

/* Activity Log (super-admins only, spec §7 Access) */
export default async function LogPage() {
  await requireAdmin({ superOnly: true });
  const list = must(await db().from("activity_log").select("*").eq("branch_id", BRANCH_ID).order("at", { ascending: false }).limit(1000)) as Log[];
  const rows: Row[] = list.map((l) => ({
    key: String(l.id), search: `${l.admin_name} ${l.action} ${l.ref} ${l.note}`,
    cells: [<small key="t">{fmtTs(l.at)}</small>, l.admin_name, l.action, l.ref, <small className="muted" key="n">{l.note}</small>],
  }));
  return <DataTable head={["When", "Admin", "Action", "Booking", "Note"]} rows={rows} empty="No activity yet." />;
}
