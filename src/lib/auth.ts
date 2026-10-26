import "server-only";
import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "./supabase";
import type { Admin } from "./types";

/* Admin access is given by verified email (spec §7 Access, v4.37):
   the signed-in Clerk user's verified primary email must be on the admins list. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const user = await currentUser();
  if (!user) return null;
  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  if (!primary || primary.verification?.status !== "verified") return null;
  const { data } = await db().from("admins").select("email, name, role").eq("email", primary.emailAddress.toLowerCase()).maybeSingle();
  return (data as Admin | null) ?? null;
});

export const isSuper = (a: Admin | null) => a?.role === "super_admin";

/** for admin pages: signed-in admin or the "no access" screen */
export async function requireAdmin(opts: { superOnly?: boolean } = {}): Promise<Admin> {
  const a = await getAdmin();
  if (!a) redirect("/admin/no-access");
  if (opts.superOnly && !isSuper(a)) redirect("/admin");
  return a;
}

/** for server actions / API routes: throws instead of redirecting */
export async function assertAdmin(opts: { superOnly?: boolean } = {}): Promise<Admin> {
  const a = await getAdmin();
  if (!a) throw new Error("This account doesn't have admin access.");
  if (opts.superOnly && !isSuper(a)) throw new Error("Only super-admins can do this.");
  return a;
}
