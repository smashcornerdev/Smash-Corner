import type { Metadata } from "next";
import { Suspense } from "react";
import BookTabs from "@/components/book/BookTabs";
import BookingFlow, { type Claim } from "@/components/book/BookingFlow";
import ClassRegistration from "@/components/book/ClassRegistration";
import { ClassSkel, CourtSkel } from "@/components/book/BookSkeleton";
import { PageTop } from "@/components/ui";
import { getCourts, getEquipment } from "@/lib/catalog";
import { bookWindow } from "@/lib/availability";
import { bookableClasses, openClassCount } from "@/lib/flows/classes";
import { readToken } from "@/lib/links";
import { sessionId } from "@/lib/session";
import { db } from "@/lib/supabase";
import { maxBookKey, todayKey } from "@/lib/time";
import type { WaitlistEntry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Book a Court",
  description: "Book a tennis or pickleball court by the hour, or register for a class or event. Send a request; once approved, pay within 24 hours.",
  alternates: { canonical: "/book" },
};

type Q = { court?: string; date?: string; mode?: string; claim?: string; sport?: string };

/* Text first, then data (spec §6, v6.04): the page title, lead and tabs are sent straight away, without waiting for the database,
   so opening the Book page is instant. Each tab's data (courts, equipment, availability, classes) and the "N open" count stream in
   after it; until then a shimmering skeleton shows in their place. */
export default async function BookPage({ searchParams }: { searchParams: Promise<Q> }) {
  const sp = await searchParams;
  // only the tab the page opens on loads its data here; the others load it the first time they are clicked (spec §6)
  const first = sp.mode === "class" && !sp.claim ? "class" : "court";

  return (
    <>
      <PageTop eyebrow="Book" title="Book a court or class" lead="Book a court by the hour, or register for a class or event. Send a request; once an admin approves it, you pay within 24 hours." />
      <div className="wrap">
        <BookTabs tabs={[
          { id: "court", label: "Court booking", panel: (
            <Suspense fallback={<CourtSkel heading={!sp.court && !sp.sport && !sp.claim} />}><CourtPanel sp={sp} withAvail={first === "court"} /></Suspense>
          ) },
          { id: "class", label: "Class / event", count: <Suspense fallback={null}><OpenCount /></Suspense>, panel: (
            first === "class" ? <Suspense fallback={<ClassSkel />}><ClassPanel /></Suspense> : <ClassRegistration />
          ) },
        ]} />
      </div>
    </>
  );
}

async function OpenCount() {
  const n = await openClassCount();
  return n ? <span className="c">{n} open</span> : null;
}

async function ClassPanel() {
  return <ClassRegistration classes={await bookableClasses()} />;
}

async function CourtPanel({ sp, withAvail }: { sp: Q; withAvail: boolean }) {
  const today = todayKey(), max = maxBookKey();
  // waitlist claim link (spec §9 step 4): the slot is pre-filled and held
  const claimed = async (): Promise<{ claim?: Claim; claimError?: string }> => {
    if (!sp.claim) return {};
    const t = readToken(sp.claim);
    const w = t?.k === "claim" ? ((await db().from("waitlist").select("*").eq("id", t.id).maybeSingle()).data as WaitlistEntry | null) : null;
    if (w && w.status === "notified" && w.claim_expires_at && new Date(w.claim_expires_at).getTime() > Date.now()) {
      return { claim: { token: sp.claim, courtId: w.court_id, date: w.date, hour: w.hour, name: w.name, email: w.email, phone: w.phone, players: w.players, expires: w.claim_expires_at } };
    }
    return { claimError: "This claim link has expired. The slot may have gone to the next person in line." };
  };
  const [courts, items, { claim, claimError }] = await Promise.all([getCourts(), getEquipment(), claimed()]);
  const avail = withAvail ? await bookWindow(courts.map((c) => c.id), await sessionId(), claim ? readToken(claim.token)!.id : null) : undefined;
  // ?sport= from the Home search bar (v5.29): a sport with one court picks it; with several, the court step opens with the date kept
  const ofSport = courts.filter((c) => c.type === sp.sport);
  const validCourt = courts.some((c) => c.id === sp.court) ? sp.court : ofSport.length === 1 ? ofSport[0].id : undefined;
  const validDate = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.date >= today && sp.date <= max ? sp.date : undefined;
  return (
    <>
      {claimError ? <div className="banner" style={{ marginBottom: 16 }}>{claimError}</div> : null}
      <BookingFlow courts={courts} items={items} today={today} max={max} avail={avail} initCourt={claim ? undefined : validCourt} initDate={claim ? undefined : validDate} claim={claim} />
    </>
  );
}
