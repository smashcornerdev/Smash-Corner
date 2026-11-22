import "server-only";
import { cache } from "react";
import { BRANCH_ID } from "./config";
import { db, must } from "./supabase";

/* Blacklist (spec §7, v6.13): people super-admins don't want booking. A booking request matches an entry when ANY of the
   entry's filled-in details equals the request's: full name (ignoring case, extra spaces and punctuation), phone (digits only,
   +63 / 63 treated as 0) or email (ignoring case). */
export type BlacklistEntry = { id: string; name: string; phone: string; email: string; note: string; added_by: string; created_at: string };

export const normName = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
export const normPhone = (s: string) => { const d = s.replace(/\D+/g, ""); return d.startsWith("63") && d.length === 12 ? "0" + d.slice(2) : d; };
export const normEmail = (s: string) => s.trim().toLowerCase();

/** the list, newest first. A read error (e.g. migration 0006 not run yet) counts as an empty list on Requests, so that tab keeps
 *  working; the Blacklist tab itself passes strict = true and shows the error. */
export const getBlacklist = cache(async (strict = false): Promise<BlacklistEntry[]> => {
  const r = await db().from("blacklist").select("*").eq("branch_id", BRANCH_ID).order("created_at", { ascending: false });
  if (r.error && !strict) { console.error("blacklist:", r.error.message); return []; }
  return must(r) as BlacklistEntry[];
});

export type BlacklistHit = { entry: BlacklistEntry; on: ("name" | "phone" | "email")[] };

/** a matcher over the current list: returns the first entry the person matches and which details matched, or null */
export function blacklistMatcher(list: BlacklistEntry[]) {
  const rows = list.map((e) => ({ e, n: normName(e.name), p: normPhone(e.phone), m: normEmail(e.email) }));
  return (who: { name: string; phone: string; email: string }): BlacklistHit | null => {
    const n = normName(who.name), p = normPhone(who.phone), m = normEmail(who.email);
    for (const r of rows) {
      const on: BlacklistHit["on"] = [];
      if (r.n && r.n === n) on.push("name");
      if (r.p && r.p === p) on.push("phone");
      if (r.m && r.m === m) on.push("email");
      if (on.length) return { entry: r.e, on };
    }
    return null;
  };
}
