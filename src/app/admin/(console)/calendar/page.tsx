import AdminCalendar from "@/components/admin/AdminCalendar";
import { requireAdmin } from "@/lib/auth";
import { getCourts } from "@/lib/catalog";

export default async function CalendarPage() {
  await requireAdmin();
  const courts = await getCourts();
  // FullCalendar Scheduler needs a commercial licence for the live site (spec §18); the fallback is the free non-commercial evaluation key
  const key = process.env.NEXT_PUBLIC_FULLCALENDAR_LICENSE || "CC-Attribution-NonCommercial-NoDerivatives";
  return <AdminCalendar courts={courts.map((c) => ({ id: c.id, title: c.name }))} licenseKey={key} />;
}
