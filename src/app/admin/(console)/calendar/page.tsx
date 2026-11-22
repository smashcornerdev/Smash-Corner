import { Suspense } from "react";
import AdminCalendar from "@/components/admin/CalendarLazy";
import { SkelCalendar } from "@/components/admin/Skeleton";
import { requireAdmin } from "@/lib/auth";
import { getCourts } from "@/lib/catalog";

/* Admin Calendar (spec §7). v6.08: text first, then data. The tab opens at once with a skeleton of the whole calendar (with the
   real legend and note); the courts and the calendar's code load after it, then the calendar replaces the skeleton and its
   bookings load (dark shade + spinner, v6.07). */
export default function CalendarPage() {
  return <Suspense fallback={<SkelCalendar />}><CalendarData /></Suspense>;
}

async function CalendarData() {
  await requireAdmin();
  const courts = await getCourts();
  // FullCalendar Scheduler needs a commercial licence for the live site (spec §18); the fallback is the free non-commercial evaluation key
  const key = process.env.NEXT_PUBLIC_FULLCALENDAR_LICENSE || "CC-Attribution-NonCommercial-NoDerivatives";
  return <AdminCalendar courts={courts.map((c) => ({ id: c.id, title: c.name }))} licenseKey={key} />;
}
