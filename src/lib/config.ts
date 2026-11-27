/* Business rules and site constants (spec §15, §6, §9). The fixed values live in supabase/functions/_shared/site.ts, shared with the Edge Functions. */
import { DEFAULT_SENDER, SITE_INFO } from "../../supabase/functions/_shared/site";
export { BRANCH_ID, OPEN_HOUR, CLOSE_HOUR, HOURS, HOLD_MINUTES, CLAIM_HOURS, PAY_HOURS, REMIND_HOURS, TIMEZONE } from "../../supabase/functions/_shared/site";

export const SITE = { ...SITE_INFO, url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" };

export const SENDER = process.env.EMAIL_FROM || DEFAULT_SENDER;

export const CLOSURE_CATEGORIES = ["Maintenance", "Weather", "Private event", "Holiday", "Other"] as const;
export const RENT_ITEM: Record<string, string> = { tennis: "racket", pickle: "paddle" }; // class rentals by court type

