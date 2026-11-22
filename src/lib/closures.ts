import type { Closure } from "./types";

export { NO_END, closureOn, closedHoursIn } from "../../supabase/functions/_shared/report"; // one copy, shared with the monthly-report Edge Function
const WDN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export { closureCovers } from "../../supabase/functions/_shared/slots";
export const closureDatesText = (c: Closure, fmt: (k: string) => string) =>
  c.repeat_days && c.repeat_days.length
    ? "Every " + [1, 2, 3, 4, 5, 6, 0].filter((d) => c.repeat_days!.includes(d)).map((d) => WDN[d]).join(", ") +
      " · from " + fmt(c.starts_on) + (c.ends_on ? " until " + fmt(c.ends_on) : " (no end date)")
    : c.starts_on === c.ends_on ? fmt(c.starts_on) : fmt(c.starts_on) + " – " + fmt(c.ends_on ?? c.starts_on);
export const closureReason = (c: Pick<Closure, "category" | "note">) => c.category + (c.note ? ": " + c.note : "");
