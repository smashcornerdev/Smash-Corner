"use client";
import dynamic from "next/dynamic";
import { SkelCalendar } from "@/components/admin/Skeleton";

/* The Admin Calendar's code (FullCalendar + Scheduler, a large download) loads in the background (spec §7, v6.08): the Calendar
   tab opens at once with the calendar skeleton, which stays until both the code and the courts have arrived. */
const AdminCalendar = dynamic(() => import("@/components/admin/AdminCalendar"), { loading: () => <SkelCalendar /> });
export default AdminCalendar;
