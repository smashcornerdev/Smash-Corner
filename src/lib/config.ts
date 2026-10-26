/* Business rules and site constants (spec §15, §6, §9). Dummy values until the client confirms them. */
export const BRANCH_ID = "qc";
export const OPEN_HOUR = 7; // 7:00 AM
export const CLOSE_HOUR = 22; // 10:00 PM (last slot 9–10 PM)
export const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
export const HOLD_MINUTES = 15; // cart hold
export const CLAIM_HOURS = 2; // waitlist claim window
export const PAY_HOURS = 24; // time to pay after approval
export const REMIND_HOURS = 24; // reminder email before a confirmed booking starts
export const TIMEZONE = "Asia/Manila";

export const SITE = {
  name: "Smash Corner",
  domain: "smashcorner-qc.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  address: "Lorem Ipsum St., Quezon City",
  phone: "(02) 8000 0000",
  email: "hello@smashcorner-qc.com",
  hours: "Daily, 7:00 AM – 10:00 PM",
};

export const SENDER = process.env.EMAIL_FROM || "Smash Corner <noreply@smashcorner-qc.com>";

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
