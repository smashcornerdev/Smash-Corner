import { Fragment } from "react";
import DataTable, { type Row } from "@/components/admin/DataTable";
import TabIntro from "@/components/admin/TabIntro";
import TabData from "@/components/admin/TabData";
import { SkelTable } from "@/components/admin/Skeleton";
import { ActBtn } from "@/components/admin/ReasonForm";
import { AddBlacklistButton } from "@/components/admin/BlacklistControls";
import { blacklistAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getBlacklist } from "@/lib/blacklist";
import { fmtTs } from "@/lib/time";

/* Management → Blacklist (super-admins, spec §7 v6.13): people who shouldn't book. Their booking requests (matched on any of full
   name, phone or email) are grouped separately on Court Bookings → Requests. Text first, then the list (skeleton until then). */
export default function BlacklistPage() {
  return (
    <>
      <TabIntro tab="blacklist" />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <p className="muted" style={{ maxWidth: "70ch" }}>People listed here can still send booking requests, but any request whose <b>full name, phone number or email</b> matches one of their details is moved to a separate <b>Blacklisted</b> group on Court Bookings → Requests, so you can review it before approving. Matching ignores capital letters, extra spaces and phone formatting (e.g. +63 917… and 0917…). Customers never see this list.</p>
        <AddBlacklistButton />
      </div>
      <TabData tab="blacklist" fallback={<SkelTable cols={6} rows={3} />}><BlacklistData /></TabData>
    </>
  );
}

async function BlacklistData() {
  await requireAdmin({ superOnly: true });
  const list = await getBlacklist(true);
  const dash = (v: string) => v || <span className="muted">—</span>;
  const rows: Row[] = list.map((e) => ({
    key: e.id,
    search: `${e.name} ${e.phone} ${e.email} ${e.note}`,
    cells: [
      <b key="n">{dash(e.name)}</b>,
      <Fragment key="p">{dash(e.phone)}</Fragment>,
      <Fragment key="e">{dash(e.email)}</Fragment>,
      <small key="r" style={{ display: "block", maxWidth: "36ch" }}>{dash(e.note)}</small>,
      <Fragment key="a">{fmtTs(e.created_at)}<br /><small className="muted">by {e.added_by || "—"}</small></Fragment>,
      <div className="acts" key="x"><ActBtn action={blacklistAction} fields={{ remove: e.id }} label="Remove" cls="btn-ghost" confirm={`Remove ${e.name || e.email || e.phone} from the blacklist? Their requests will go back to the normal Requests list.`} trace /></div>,
    ],
  }));
  return <DataTable head={["Full name", "Phone", "Email", "Reason", "Added", "Actions"]} rows={rows} empty="No one is blacklisted." />;
}
