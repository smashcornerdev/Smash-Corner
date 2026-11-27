/* Business rules and fixed site details (spec §15, §6, §9), shared by the website (src/lib/config.ts re-exports them) and
   the Edge Functions, so both always use the same hours, windows and contact details. No imports: keep it that way.
   Dummy values until the client confirms them. The site URL is not here: the app reads NEXT_PUBLIC_SITE_URL, the Edge
   Functions read their SITE_URL secret. */
export const BRANCH_ID = "qc";
export const OPEN_HOUR = 7; // 7:00 AM
export const CLOSE_HOUR = 22; // 10:00 PM (last slot 9–10 PM)
export const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
export const HOLD_MINUTES = 15; // cart hold
export const CLAIM_HOURS = 2; // waitlist claim window
export const PAY_HOURS = 24; // time to pay after approval
export const REMIND_HOURS = 24; // reminder email before a confirmed booking starts
export const TIMEZONE = "Asia/Manila";

export const SITE_INFO = {
  name: "Smash Corner",
  domain: "smashcorner-qc.com",
  address: "98 Maria Clara St. corner Sto. Domingo Ave., Quezon City",
  phone: "(02) 8332 1900",
  email: "smash.corner2026@gmail.com",
  // Google Maps pin for 98 Maria Clara St. (Contact page map); NEXT_PUBLIC_MAP_EMBED_URL overrides it
  mapEmbed: "https://maps.google.com/maps?q=14.627726,121.005311&z=17&output=embed",
  hours: "Daily, 7:00 AM – 10:00 PM",
};
export const DEFAULT_SENDER = "Smash Corner <noreply@smashcorner-qc.com>";
