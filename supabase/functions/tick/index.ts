// Smash Corner · every-minute jobs (spec §18 Scheduled jobs). Supabase Edge Function (Deno), called by pg_cron every
// minute (supabase/migrations/0002_cron.sql). The jobs themselves are in jobs.ts:
//   1. expire 15-minute cart holds and offer the hours to the waitlist
//   2. expire unused 2-hour waitlist claims (email the next person in line) and entries whose slot has started
//   3. court requests not paid within 24 hours of approval → unpaid, customer emailed, hours released
//   4. class registrations not paid within 24 hours of approval → unpaid, participant emailed
//   5. reminder emails 24 hours before confirmed bookings and classes
//
// Header: Authorization: Bearer <CRON_SECRET>
// Deploy:  supabase functions deploy tick --no-verify-jwt      (the function checks CRON_SECRET itself)
// Secrets: CRON_SECRET, LINK_SECRET (same as the website: signs waitlist claim links), RESEND_API_KEY, SITE_URL;
//          optional EMAIL_FROM, EMAIL_TEST_TO, EMAIL_DRY_RUN=true. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided.
import { createClient } from "npm:@supabase/supabase-js@2";
import { DEFAULT_SENDER } from "../_shared/site.ts";
import { tick } from "./jobs.ts";

function authorized(req: Request): boolean {
  const enc = new TextEncoder();
  const want = enc.encode(Deno.env.get("CRON_SECRET") ?? ""), got = enc.encode(req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "");
  if (!want.length || got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want[i] ^ got[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const linkSecret = Deno.env.get("LINK_SECRET");
  if (!linkSecret) return Response.json({ error: "LINK_SECRET not configured" }, { status: 500 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const result = await tick({
    db, linkSecret,
    siteUrl: (Deno.env.get("SITE_URL") || "https://smashcorner-qc.com").replace(/\/+$/, ""),
    mail: {
      apiKey: Deno.env.get("RESEND_API_KEY"), from: Deno.env.get("EMAIL_FROM") || DEFAULT_SENDER,
      testTo: Deno.env.get("EMAIL_TEST_TO") || undefined, dryRun: Deno.env.get("EMAIL_DRY_RUN") === "true",
    },
  }).runAll();
  const failed = Object.values(result).some((v) => typeof v === "string");
  return Response.json(result, { status: failed ? 500 : 200 });
});
