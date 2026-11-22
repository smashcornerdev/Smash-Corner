"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import type { DatesSetArg, EventContentArg, EventInput } from "@fullcalendar/core";
import { calSwap, still } from "@/lib/gsap/calMotion";
import CalPopover, { type PopState } from "@/components/admin/CalPopover";
import type { CalPop } from "@/app/api/admin/calendar/route";
import { CAL_NOTE, CalLegend } from "@/components/admin/CalParts";
import { SkelCalendar } from "@/components/admin/Skeleton";

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/* Admin Calendar (spec §7, §14): Month / Week / Day (one column per court, FullCalendar Scheduler) / List.
   Loading (v6.09): the skeleton is the only loading state. It stays until the latest bookings request has delivered (the calendar is built
   hidden behind it; see `source`), then the calendar and its bookings appear at once. Later loads (arrows, views, filters) just swap the
   bookings in, with no spinner, shade or fade.
   Motion (spec §4, v6.00; calMotion.ts): the calendar body slides / rises in on a view change, ◀ ▶, Today or a court filter;
   Off with reduced motion. v6.12: no hover / press motion on bookings; clicking one opens its details card beside it (CalPopover). */
export default function AdminCalendar({ courts, licenseKey }: { courts: { id: string; title: string }[]; licenseKey: string }) {
  const router = useRouter();
  const [court, setCourt] = useState("all");
  const courtNow = useRef(court); // read by the event source at fetch time
  /* Bookings source (v6.10 fixes). Made once (useMemo): FullCalendar treats a new `events` value as a new source and drops the
     bookings, so an inline one emptied the calendar on every re-render. We fetch ourselves and number each request: the skeleton
     only goes once the LATEST request has handed its bookings to the calendar. Earlier requests can finish first and must not
     reveal an empty grid: in development React mounts the calendar twice (the first copy's fetch is thrown away), and phones
     fetch the Week, then the Day they switch to. */
  const seq = useRef(0);
  const source = useMemo(() => (info: { startStr: string; endStr: string }, ok: (evs: EventInput[]) => void, fail: (e: Error) => void) => {
    const id = ++seq.current;
    const q = new URLSearchParams({ court: courtNow.current, start: info.startStr, end: info.endStr });
    fetch(`/api/admin/calendar?${q}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Calendar ${r.status}`))))
      .then((evs: EventInput[]) => ok(evs), (e: Error) => fail(e))
      .finally(() => { if (id === seq.current) requestAnimationFrame(() => setShown(true)); });
  }, []);
  const columns = useMemo(() => courts.filter((c) => court === "all" || c.id === court), [courts, court]);
  const ref = useRef<FullCalendar>(null);
  const row = useRef<HTMLDivElement>(null), wrap = useRef<HTMLDivElement>(null), note = useRef<HTMLParagraphElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [pop, setPop] = useState<PopState | null>(null); // the details card open beside a booking (v6.12)
  const closePop = useCallback((refocus: boolean) => setPop((p) => { if (p && refocus) p.anchor.focus?.({ preventScroll: true }); return null; }), []);
  const [shown, setShown] = useState(false); // first bookings loaded: the calendar replaces the skeleton (v6.09)
  const ready = useRef(false); // mounted (and the phone's Day view switch done): later changes animate
  const last = useRef<{ type: string; start: number } | null>(null);
  const datesSet = (a: DatesSetArg) => {
    const p = last.current, start = a.start.getTime();
    last.current = { type: a.view.type, start };
    setPop(null); // new dates or view: the booking's card no longer applies
    if (!p || !ready.current || still()) return;
    const kind = p.type !== a.view.type ? "view" : start < p.start ? "prev" : start > p.start ? "next" : null;
    if (kind) calSwap(wrap.current!, kind);
  };
  // phones open on Day view (one column per court, fits the screen); desktop opens on Week
  useEffect(() => { if (window.matchMedia("(max-width:700px)").matches) ref.current?.getApi().changeView("resourceTimeGridDay"); }, []);
  // later changes (view, arrows, filter) animate; not the phone's switch to Day view above
  useEffect(() => { const t = setTimeout(() => { ready.current = true; }); return () => clearTimeout(t); }, []);
  const content = (arg: EventContentArg) => {
    const p = arg.event.extendedProps as { court?: string; extra?: string; closed?: boolean };
    const title = esc(arg.event.title), court = esc(p.court), extra = esc(p.extra);
    if (p.closed) return { html: `<span class="ev-closed-t">${title}</span>` };
    const [name, ...rest] = title.split(" · ");
    const r = [...rest, extra].filter(Boolean).join(" · ");
    if (arg.view.type.startsWith("list")) return { html: `<b>${court}</b> · ${title}${extra ? ` · ${extra}` : ""}` };
    if (arg.view.type === "dayGridMonth") return { html: `<div class="ev-in"><span>${court} · ${name}</span></div>` };
    return { html: `<div class="ev-in" title="${court} · ${title}"><span class="ev-c">${court}</span><span>${name}</span><span class="ev-r">${r}</span></div>` };
  };
  return (
    <div className="cal-host" ref={host}>
    {shown ? null : <SkelCalendar />}
    <div className={"stack" + (shown ? "" : " cal-pending")} aria-hidden={shown ? undefined : true}>
      <div ref={row} className="row" style={{ justifyContent: "space-between" }}>
        <div className="chips" role="group" aria-label="Filter by court">
          {[{ id: "all", title: "All courts" }, ...courts].map((c) => (
            <button key={c.id} className={"chip" + (court === c.id ? " on" : "")} aria-pressed={court === c.id} onClick={() => { if (c.id === court) return; courtNow.current = c.id; setCourt(c.id); setPop(null); setTimeout(() => { ref.current?.getApi().refetchEvents(); if (ready.current && !still() && wrap.current) calSwap(wrap.current, "filter"); }); }}>{c.title}</button>
          ))}
        </div>
        <CalLegend />
      </div>
      <div ref={wrap} className="fc-wrap">
        <FullCalendar
          ref={ref}
          schedulerLicenseKey={licenseKey}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, resourceTimeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,resourceTimeGridDay,listWeek" }}
          buttonText={{ month: "Month", week: "Week", day: "Day", list: "List", today: "Today" }}
          views={{ resourceTimeGridDay: { buttonText: "Day" } }}
          timeZone="Asia/Manila"
          slotMinTime="07:00:00" slotMaxTime="22:00:00" allDaySlot={false} nowIndicator height="auto"
          eventMaxStack={2} dayMaxEvents={4}
          resources={columns}
          events={source}
          eventContent={content}
          datesSet={datesSet}
          eventClick={(i) => {
            // v6.12: open (or close, on a second click) the details card beside the booking, like Google Calendar
            const x = i.event.extendedProps as { href?: string; pop?: CalPop };
            i.jsEvent.preventDefault();
            if (!x.href || !x.pop) return;
            setPop((p) => (p?.anchor === i.el ? null : { pop: x.pop!, href: x.href!, anchor: i.el }));
          }}
          dateClick={(i) => { if (i.view.type === "dayGridMonth") ref.current?.getApi().changeView("resourceTimeGridDay", i.date); }}
          titleFormat={{ year: "numeric", month: "2-digit", day: "2-digit" }}
          dayHeaderFormat={{ weekday: "short", month: "2-digit", day: "2-digit", omitCommas: true }}
        />
      </div>
      <p ref={note} className="muted" style={{ fontSize: ".82rem" }}>{CAL_NOTE}</p>
    </div>
    {pop && host.current ? <CalPopover state={pop} host={host.current} onClose={closePop} onOpen={(h) => { setPop(null); router.push(h); }} /> : null}
    </div>
  );
}
