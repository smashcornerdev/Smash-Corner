import type { Metadata } from "next";
import Link from "next/link";
import BookingFlow, { type Claim } from "@/components/book/BookingFlow";
import ClassRegistration, { type BookableClass } from "@/components/book/ClassRegistration";
import { PageTop } from "@/components/ui";
import { getCourts, getEquipment } from "@/lib/catalog";
import { classesWithCounts } from "@/lib/flows/classes";
import { readToken } from "@/lib/links";
import { db } from "@/lib/supabase";
import { maxBookKey, todayKey } from "@/lib/time";
import type { WaitlistEntry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Book a Court",
  description: "Book a tennis or pickleball court by the hour, or register for a class or event. Send a request; once approved, pay within 24 hours.",
  alternates: { canonical: "/book" },
};

type SP = Promise<{ court?: string; date?: string; mode?: string; claim?: string }>;

export default async function BookPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [courts, items, rows] = await Promise.all([getCourts(), getEquipment(), classesWithCounts({ bookable: true })]);
  const today = todayKey(), max = maxBookKey();
  const mode = sp.mode === "class" ? "class" : "court";

  // waitlist claim link (spec §9 step 4): the slot is pre-filled and held
  let claim: Claim | undefined;
  let claimError = "";
  if (sp.claim) {
    const t = readToken(sp.claim);
    const w = t?.k === "claim" ? ((await db().from("waitlist").select("*").eq("id", t.id).maybeSingle()).data as WaitlistEntry | null) : null;
    if (w && w.status === "notified" && w.claim_expires_at && new Date(w.claim_expires_at).getTime() > Date.now()) {
      claim = { token: sp.claim, courtId: w.court_id, date: w.date, hour: w.hour, name: w.name, email: w.email, phone: w.phone, players: w.players, expires: w.claim_expires_at };
    } else claimError = "This claim link has expired. The slot may have gone to the next person in line.";
  }

  const classes: BookableClass[] = rows.map(({ k, taken, rented, state }) => {
    const c = courts.find((x) => x.id === k.court_id);
    return {
      id: k.id, title: k.title, court: c?.name ?? k.court_id, date: k.date, start: k.start_hour, end: k.end_hour, deadline: k.deadline,
      fee: k.fee, rentalFee: k.rental_fee, rentalLeft: Math.max(0, k.rental_qty - rented), rentalItem: c?.type === "tennis" ? "Tennis Racket" : "Pickleball Paddle",
      seatsLeft: Math.max(0, k.capacity - taken), capacity: k.capacity, full: state === "full",
    };
  });
  const nOpen = classes.filter((c) => !c.full).length;
  const validCourt = courts.some((c) => c.id === sp.court) ? sp.court : undefined;
  const validDate = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.date >= today && sp.date <= max ? sp.date : undefined;

  return (
    <>
      <PageTop eyebrow="Book" title="Book a court or class" lead="Book a court by the hour, or register for a class or event. Send a request; once an admin approves it, you pay within 24 hours." />
      <div className="wrap">
        <div className="mode-sw" role="group" aria-label="What are you booking?">
          <Link href="/book" className={"mode-btn" + (mode === "court" ? " on" : "")} aria-current={mode === "court" ? "page" : undefined}>Court booking</Link>
          <Link href="/book?mode=class" className={"mode-btn" + (mode === "class" ? " on" : "")} aria-current={mode === "class" ? "page" : undefined}>
            Class / event{nOpen ? <span className="c">{nOpen} open</span> : null}
          </Link>
        </div>
        {claimError ? <div className="banner" style={{ marginBottom: 16 }}>{claimError}</div> : null}
        {mode === "class" ? <ClassRegistration classes={classes} /> : (
          <BookingFlow courts={courts} items={items} today={today} max={max} initCourt={claim ? undefined : validCourt} initDate={claim ? undefined : validDate} claim={claim} />
        )}
      </div>
    </>
  );
}
