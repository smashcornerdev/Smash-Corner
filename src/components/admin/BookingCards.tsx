"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/admin/Modal";

export type BookingCard = { eyebrow: string; title: React.ReactNode; body: React.ReactNode };

/* Booking cards behind the View buttons (spec §7: Dashboard v5.74, Court Bookings tabs v5.76). Every listed booking comes with its card already rendered
   (`cards`, by booking id), so "View" opens it instantly with no trip to the server: the click is caught here, the address
   becomes ?view=<id> (browser history only, no reload) and the card opens with its animation (v5.75, cardIn). ×, Esc, the backdrop or browser Back closes it,
   with the closing animation (v5.87, cardOut) however it closes, including Back and the redirect after an action.
   A View link for a booking that isn't here falls through to a normal load of its href. */
export default function BookingCards({ cards, children }: { cards: Record<string, BookingCard>; children: React.ReactNode }) {
  const sp = useSearchParams();
  const id = sp.get("view");
  const pushed = useRef(false); // opened by a click here (so closing can step back) vs. loaded with ?view=
  const jump = useRef(""); // the link's #section (e.g. Cancel class → #cancel): the card scrolls to it once open (v5.86)
  const url = (view: string | null) => {
    const p = new URLSearchParams(window.location.search);
    if (view) p.set("view", view); else p.delete("view");
    const q = p.toString();
    return window.location.pathname + (q ? `?${q}` : "");
  };
  const closedHere = useRef(false); // closed with ×/Esc/backdrop: its closing animation has already played
  const close = useCallback(() => {
    closedHere.current = true;
    if (pushed.current) { pushed.current = false; window.history.back(); }
    else window.history.replaceState(null, "", url(null));
  }, []);
  const onClickCapture = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab / window: let the browser do it
    const a = (e.target as Element).closest<HTMLAnchorElement>("a[href*='view=']"); // ?view= or &view=
    const v = a ? new URL(a.href).searchParams.get("view") : null;
    if (!v || !cards[v]) return;
    jump.current = new URL(a!.href).hash; // a is set when v is
    e.preventDefault();
    e.stopPropagation(); // keep next/link from navigating
    pushed.current = true;
    window.history.pushState(null, "", url(v));
  };
  // closed from outside (Back, an action's redirect to the list): keep the card a moment to play its closing animation
  const [leaving, setLeaving] = useState<string | null>(null);
  const prev = useRef(id);
  useLayoutEffect(() => {
    if (id) setLeaving(null);
    else if (prev.current && !closedHere.current && cards[prev.current]) setLeaving(prev.current);
    closedHere.current = false;
    prev.current = id;
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownId = id ?? leaving;
  const card = id ? cards[id] : undefined;
  const shownCard = shownId ? cards[shownId] : undefined;
  useEffect(() => {
    if (!card || !jump.current) return;
    const sel = jump.current;
    jump.current = "";
    const f = requestAnimationFrame(() => {
      try { document.querySelector<HTMLElement>(`.modal ${sel}`)?.scrollIntoView({ block: "start" }); } catch { /* not a valid id */ }
    });
    return () => cancelAnimationFrame(f);
  }, [card]);
  return (
    <div style={{ display: "contents" }} onClickCapture={onClickCapture}>
      {children}
      {shownCard ? (
        <Modal key={shownId} wide intro outro leave={!id} eyebrow={shownCard.eyebrow} title={shownCard.title}
          onClose={id ? close : () => setLeaving(null)}>{shownCard.body}</Modal>
      ) : null}
    </div>
  );
}
