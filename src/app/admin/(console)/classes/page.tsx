import { Fragment } from "react";
import Link from "next/link";
import DataTable, { type Row } from "@/components/admin/DataTable";
import { ActBtn } from "@/components/admin/ReasonForm";
import { Pill } from "@/components/ui";
import ClassForm from "@/components/admin/ClassForm";
import ModalButton from "@/components/admin/Modal";
import BookingCards, { type BookingCard } from "@/components/admin/BookingCards";
import ClassDetail from "@/components/admin/ClassDetail";
import PastDetails from "@/components/admin/PastDetails";
import TabIntro from "@/components/admin/TabIntro";
import TabData from "@/components/admin/TabData";
import { SkelBanner, SkelBtn, SkelTable } from "@/components/admin/Skeleton";
import TableExport from "@/components/admin/TableExport";
import { db, must } from "@/lib/supabase";
import type { ClassReg } from "@/lib/types";
import { classStatusAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { RENT_ITEM } from "@/lib/config";
import { getCourts, getEquipment, getInventory } from "@/lib/catalog";
import { classesWithCounts, type ClassWithCounts } from "@/lib/flows/classes";
import { peso } from "@/lib/format";
import { fmtDate, fmtH, fmtTs, todayKey } from "@/lib/time";

const LABEL: Record<string, string> = { open: "open", full: "full", closed: "closed", cancelled: "cancelled", done: "finished" };

/* Classes & Events → Registration Controls (spec §7): closed by default; admins open registration per class.
   Every class's registrations are loaded with the page (v5.86), so "Registrations (n)" and "Cancel class" open its card instantly
   (?view=<class id>; Cancel class jumps to the card's cancel section) instead of going to the class page. */
export default function ClassControls() {
  // v6.01: the note shows at once; the buttons, banner and tables stream in after it (skeleton until then)
  return (
    <>
      <TabIntro tab="controls" />
      <p className="muted" style={{ maxWidth: "68ch" }}>Class and event registration is <b>closed by default</b>. Open registration to publish a class on the Book page. It closes on its own at the deadline or when the class is full. The court is blocked for court bookings during the class.</p>
      <TabData tab="controls" fallback={<><div className="row"><SkelBtn w={190} /></div><SkelBanner /><SkelTable cols={8} search={false} rows={3} /></>}><ControlsData /></TabData>
    </>
  );
}

async function ControlsData() {
  await requireAdmin();
  const [rows, courts, items, inv] = await Promise.all([classesWithCounts(), getCourts(), getEquipment(), getInventory()]);
  const cname = (id: string) => courts.find((c) => c.id === id)?.name ?? id;
  const up = rows.filter((r) => !["done", "cancelled"].includes(r.state));
  const past = rows.filter((r) => ["done", "cancelled"].includes(r.state)).reverse();
  const nOpen = up.filter((r) => r.state === "open").length;
  // one query for every class's registrations, grouped per class for the cards
  const regs = rows.length ? must(await db().from("class_registrations").select("*").in("class_id", rows.map((r) => r.k.id)).order("created_at")) as ClassReg[] : [];
  const cards: Record<string, BookingCard> = Object.fromEntries(rows.map(({ k }) => [k.id, {
    eyebrow: "Class / event",
    title: k.title,
    body: <ClassDetail k={k} regs={regs.filter((r) => r.class_id === k.id)} courtName={cname(k.court_id)} back="/admin/classes" card />,
  }]));
  const table = (l: ClassWithCounts[], old: boolean) => {
    const data: Row[] = l.map(({ k, taken, rented, notConfirmed, all, state }) => ({
      key: k.id, search: `${k.title} ${cname(k.court_id)} ${fmtDate(k.date)}`,
      cells: [
        <Fragment key="t"><b>{k.title}</b><br /><small className="muted">{k.kind === "event" ? "Event" : "Class"} · {cname(k.court_id)}</small></Fragment>,
        <Fragment key="w">{fmtDate(k.date)}<br /><small className="muted">{fmtH(k.start_hour)} – {fmtH(k.end_hour)}</small></Fragment>,
        <small key="d">{fmtTs(k.deadline)}</small>,
        <Fragment key="n">{taken} / {k.capacity}{notConfirmed ? <><br /><small className="muted">{notConfirmed} not confirmed yet</small></> : null}</Fragment>,
        peso(k.fee),
        <small key="r">{k.rental_fee == null ? "None" : <>{peso(k.rental_fee)}<br /><span className="muted">{Math.max(0, k.rental_qty - rented)} of {k.rental_qty} left</span></>}</small>,
        <Fragment key="s"><Pill s={state} label={LABEL[state]} />{state === "closed" ? <><br /><small className="muted">{k.status === "open" ? "deadline passed" : "closed by admin"}</small></> : null}</Fragment>,
        <div className="acts" key="a">
          <Link className="btn btn-lav btn-sm" href={`/admin/classes?view=${k.id}`} scroll={false} data-trace>Registrations ({all})</Link>
          {!old && (state === "open" || state === "full") ? <ActBtn action={classStatusAction} fields={{ id: k.id, op: "close" }} label="Close registration" cls="btn-ghost" trace /> : null}
          {!old && state === "closed" && k.status === "closed" && new Date(k.deadline).getTime() > Date.now() ? <ActBtn action={classStatusAction} fields={{ id: k.id, op: "reopen" }} label="Reopen registration" cls="btn-ghost" trace /> : null}
          {!old ? <Link className="btn btn-danger btn-sm" href={`/admin/classes?view=${k.id}#cancel`} scroll={false} data-trace>Cancel class</Link> : null}
        </div>,
      ],
    }));
    return <DataTable head={["Class", "Date & time", "Registration deadline", "Slots taken", "Fee", "Rentals", "Status", "Actions"]} num={[3, 4]} rows={data} empty="No classes yet." />;
  };
  const td = todayKey();
  const freeOf = (id: string) => { const r = inv.find((x) => x.item_id === id); return r ? Math.max(0, r.owned - r.out_of_service) : 0; };
  // rented per court type: rackets on tennis courts, paddles on pickleball courts
  const rentals = Object.fromEntries(Object.entries(RENT_ITEM).map(([type, id]) => {
    const it = items.find((i) => i.id === id);
    return [type, { name: it?.name.replace(/^(Tennis|Pickleball) /, "") ?? id, fee: it?.rate ?? 0, qty: freeOf(id) }];
  }));
  return (
    <BookingCards cards={cards}>
      {/* v5.96: the note on top (in the page above), then Open registration with the Export ⤓ icon on its right (phones; on wider screens Export stays beside the title) */}
      <div className="row ctl-acts">
        <ModalButton label="+ Open registration" eyebrow="Classes & Events" title="Open registration" wide trace intro outro>
          <ClassForm courts={courts.map((c) => ({ id: c.id, name: c.name, type: c.type }))} rentals={rentals} today={td} />
        </ModalButton>
        <TableExport courts={courts} kind="class" />
      </div>
      <div className={"banner" + (nOpen ? " lime" : "")}>{nOpen ? <>Registration is <b>open</b> for {nOpen} class{nOpen > 1 ? "es" : ""}. Customers see {nOpen > 1 ? "them" : "it"} under &quot;Class / event&quot; on the Book page.</> : <>Registration is <b>closed</b>. Customers see &quot;Class registration is closed&quot; on the Book page.</>}</div>
      <div className="stack"><h2 style={{ fontSize: "1.1rem" }}>Upcoming</h2>{table(up, false)}</div>
      {past.length ? <PastDetails label={<>Past &amp; cancelled ({past.length})</>}>{table(past, true)}</PastDetails> : null}
    </BookingCards>
  );
}
