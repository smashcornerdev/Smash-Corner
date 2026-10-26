import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getGroups } from "@/lib/adminNav";
import { getCourts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [groups, courts] = await Promise.all([getGroups(admin), getCourts()]);
  return (
    <Suspense>
      <AdminShell groups={groups} courts={courts.map((c) => ({ id: c.id, name: c.name }))} who={{ name: admin.name, role: admin.role === "super_admin" ? "Super-admin" : "Admin" }}>{children}</AdminShell>
    </Suspense>
  );
}
