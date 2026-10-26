"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import type { EventContentArg } from "@fullcalendar/core";

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/* Admin Calendar (spec §7, §14): Month / Week / Day (one column per court, FullCalendar Scheduler) / List */
export default function AdminCalendar({ courts, licenseKey }: { courts: { id: string; title: string }[]; licenseKey: string }) {
  const router = useRouter();
  const [court, setCourt] = useState("all");
  const ref = useRef<FullCalendar>(null);
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
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="chips" role="group" aria-label="Filter by court">
          {[{ id: "all", title: "All courts" }, ...courts].map((c) => (
            <button key={c.id} className={"chip" + (court === c.id ? " on" : "")} aria-pressed={court === c.id} onClick={() => { setCourt(c.id); setTimeout(() => ref.current?.getApi().refetchEvents()); }}>{c.title}</button>
          ))}
        </div>
        <div className="legend">
          <span><i style={{ background: "var(--c-t1)" }} />Tennis 1</span><span><i style={{ background: "var(--c-p1)" }} />Pickleball 1</span><span><i style={{ background: "var(--c-p2)" }} />Pickleball 2</span>
          <span><i style={{ border: "2px dashed var(--muted)", background: "transparent" }} />Not confirmed yet</span>
        </div>
      </div>
      <div className="fc-wrap">
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
          resources={courts.filter((c) => court === "all" || c.id === court)}
          events={{ url: "/api/admin/calendar", extraParams: () => ({ court }) }}
          eventContent={content}
          eventClick={(i) => { const h = (i.event.extendedProps as { href?: string }).href; if (h) router.push(h); }}
          dateClick={(i) => { if (i.view.type === "dayGridMonth") ref.current?.getApi().changeView("resourceTimeGridDay", i.date); }}
          titleFormat={{ year: "numeric", month: "2-digit", day: "2-digit" }}
          dayHeaderFormat={{ weekday: "short", month: "2-digit", day: "2-digit", omitCommas: true }}
        />
      </div>
      <p className="muted" style={{ fontSize: ".82rem" }}>Day view shows one column per court. Click a booking to view, approve, edit or cancel it. Striped blocks are classes; red striped areas are closures. In Month view, click a day to open it.</p>
    </div>
  );
}
