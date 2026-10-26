import "server-only";
import { BRANCH_ID } from "./config";
import { db } from "./supabase";
import type { Admin } from "./types";

/** Activity Log: who did what, when (spec §7). admin = null → "System" */
export async function logAction(admin: Admin | null, action: string, ref = "", note = "") {
  await db().from("activity_log").insert({
    branch_id: BRANCH_ID, admin_email: admin?.email ?? null, admin_name: admin?.name ?? "System", action, ref, note,
  });
}
