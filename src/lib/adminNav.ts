import "server-only";
import { cache } from "react";
import { BRANCH_ID } from "./config";
import { db, must } from "./supabase";
import { isSuper } from "./auth";
import { todayKey } from "./time";
import type { Admin } from "./types";

/* Admin Console sections and their tabs (spec §7 Console Sections) */
export type Tab = { href: string; label: string; count?: number | string | null };
export type Group = { id: string; label: string; tabs: Tab[]; badge?: number; superOnly?: boolean };

export const getCounts = cache(async () => {
  const [bookings, regs, waits, applied] = await Promise.all([
    db().from("bookings").select("order_id, status, date").eq("branch_id", BRANCH_ID).in("status", ["pending", "awaiting", "verify", "approved", "rejected", "cancelled", "unpaid"]),
    db().from("class_registrations").select("status"),
    db().from("waitlist").select("id", { count: "exact", head: true }).eq("branch_id", BRANCH_ID).in("status", ["waiting", "notified"]),
    db().from("waitlist").select("id", { count: "exact", head: true }).eq("branch_id", BRANCH_ID).eq("status", "applied"),
  ]);
  const b = must(bookings) as { order_id: string; status: string; date: string }[];
  const orders = (st: string) => new Set(b.filter((x) => x.status === st).map((x) => x.order_id)).size; // one approval per order
  const n = (st: string) => b.filter((x) => x.status === st).length;
  const r = must(regs) as { status: string }[];
  const rc = (st: string) => r.filter((x) => x.status === st).length;
  return {
    pending: orders("pending"), awaiting: orders("awaiting"), verify: orders("verify"),
    approved: b.filter((x) => x.status === "approved" && x.date >= todayKey()).length,
    rejected: n("rejected"), cancelled: n("cancelled"), unpaid: n("unpaid"), waitlist: waits.count ?? 0, waitApplied: applied.count ?? 0,
    cls: { pending: rc("pending"), awaiting: rc("awaiting"), verify: rc("verify"), approved: rc("approved"), rejected: rc("rejected"), cancelled: rc("cancelled"), unpaid: rc("unpaid") },
  };
});

export async function getGroups(admin: Admin): Promise<Group[]> {
  const c = await getCounts();
  const groups: Group[] = [
    { id: "dash", label: "Dashboard", tabs: [{ href: "/admin", label: "Dashboard" }] },
    { id: "reports", label: "Reports", superOnly: true, tabs: [{ href: "/admin/reports", label: "Reports" }] },
    {
      id: "court", label: "Court Bookings", badge: c.pending + c.verify + c.waitApplied, tabs: [
        { href: "/admin/bookings/pending", label: "Requests", count: c.pending },
        { href: "/admin/bookings/awaiting", label: "Awaiting payment", count: c.awaiting },
        { href: "/admin/bookings/verify", label: "Verify payment", count: c.verify },
        { href: "/admin/bookings/approved", label: "Approved", count: c.approved },
        { href: "/admin/bookings/rejected", label: "Rejected", count: c.rejected },
        { href: "/admin/bookings/cancelled", label: "Cancelled", count: c.cancelled },
        { href: "/admin/bookings/unpaid", label: "Unpaid", count: c.unpaid },
        { href: "/admin/waitlist", label: "Waitlist", count: c.waitApplied + c.waitlist },
      ],
    },
    {
      id: "class", label: "Classes & Events", badge: c.cls.pending + c.cls.verify, tabs: [
        { href: "/admin/classes", label: "Registration Controls" },
        { href: "/admin/classes/pending", label: "Requests", count: c.cls.pending },
        { href: "/admin/classes/awaiting", label: "Awaiting payment", count: c.cls.awaiting },
        { href: "/admin/classes/verify", label: "Verify payment", count: c.cls.verify },
        { href: "/admin/classes/approved", label: "Approved", count: c.cls.approved },
        { href: "/admin/classes/rejected", label: "Rejected", count: c.cls.rejected },
        { href: "/admin/classes/cancelled", label: "Cancelled", count: c.cls.cancelled },
        { href: "/admin/classes/unpaid", label: "Unpaid", count: c.cls.unpaid },
      ],
    },
    {
      id: "mgmt", label: "Management", superOnly: true, tabs: [
        { href: "/admin/closures", label: "Closures" }, { href: "/admin/payment-methods", label: "Payment Methods" }, { href: "/admin/inventory", label: "Equipment Inventory" },
      ],
    },
    { id: "calendar", label: "Calendar", tabs: [{ href: "/admin/calendar", label: "Calendar" }] },
    { id: "admin", label: "Admin", superOnly: true, tabs: [{ href: "/admin/log", label: "Activity Log" }, { href: "/admin/admins", label: "Admin Accounts" }] },
  ];
  return groups.filter((g) => !g.superOnly || isSuper(admin));
}
