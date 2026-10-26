import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/* Service-role client: server only. RLS has no public policies, so this is the only way in. */
let client: SupabaseClient | null = null;
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** throw on a Supabase error, return the data otherwise */
export function must<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new DbError(res.error.message, res.error.code);
  return res.data;
}
export class DbError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}
/** custom errors raised by the SQL functions, e.g. 'slot_taken' */
export const dbErrorIs = (e: unknown, key: string) => e instanceof Error && e.message.includes(key);
