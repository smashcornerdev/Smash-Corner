import "server-only";

/* Customer record columns (spec §7). The single definition lives in supabase/functions/_shared/records.ts so Export to Excel
   and the record-to-sheets Edge Function (Google Sheets) always write the same columns. */
export { CLASS_HEAD, COURT_HEAD, classRecord, courtRecord, type Cell } from "../../supabase/functions/_shared/records";
