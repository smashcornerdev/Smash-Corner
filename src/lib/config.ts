/* Business rules and site constants (spec §15, §6, §9). The fixed values live in supabase/functions/_shared/site.ts, shared with the Edge Functions. */
import { DEFAULT_SENDER, SITE_INFO } from "../../supabase/functions/_shared/site";
export { BRANCH_ID, OPEN_HOUR, CLOSE_HOUR, HOURS, HOLD_MINUTES, CLAIM_HOURS, PAY_HOURS, REMIND_HOURS, TIMEZONE } from "../../supabase/functions/_shared/site";

export const SITE = { ...SITE_INFO, url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" };

export const SENDER = process.env.EMAIL_FROM || DEFAULT_SENDER;

export const CLOSURE_CATEGORIES = ["Maintenance", "Weather", "Private event", "Holiday", "Other"] as const;
export const RENT_ITEM: Record<string, string> = { tennis: "racket", pickle: "paddle" }; // class rentals by court type

/* Lorem ipsum placeholder copy (spec §1 content rule) */
export const L = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
];
