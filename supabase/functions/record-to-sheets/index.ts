// Smash Corner · record to Google Sheets (spec §7 Google Sheets Sync). Supabase Edge Function (Deno).
// The website calls this right after a record changes (src/lib/sheets.ts): when a court booking or class registration is
// approved or edited its row is written, and when it is cancelled its row is removed. Rows are found by reference number
// (column A), so recording the same record twice updates its row instead of adding a second one.
// Values are written RAW so a customer's text can never run as a formula and phone numbers keep their leading zero.
//
// Body: { tab: "court" | "class", rows?: (string | number)[][], remove?: string[] }   (rows[i][0] is the reference)
// Header: x-sheets-secret: <SHEETS_SECRET>
//
// Deploy:  supabase functions deploy record-to-sheets --no-verify-jwt     (the function checks SHEETS_SECRET itself)
// Secrets: supabase secrets set SHEETS_SECRET=… GOOGLE_SHEETS_ID=… SERVICE_ACCOUNT_KEY="$(cat service-account.json)"
import { CLASS_HEAD, COURT_HEAD } from "../_shared/records.ts";

const API = "https://sheets.googleapis.com/v4/spreadsheets";
const TABS = {
  court: { title: "Court Bookings", head: COURT_HEAD, ref: /^SC-\d+$/ },
  class: { title: "Class Registrations", head: CLASS_HEAD, ref: /^CL-\d+$/ },
} as const;

type Value = string | number;
type Body = { tab: keyof typeof TABS; rows?: Value[][]; remove?: string[] };

/** constant-time comparison with SHEETS_SECRET */
function authorized(req: Request): boolean {
  const enc = new TextEncoder();
  const want = enc.encode(Deno.env.get("SHEETS_SECRET") ?? ""), got = enc.encode(req.headers.get("x-sheets-secret") ?? "");
  if (!want.length || got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want[i] ^ got[i];
  return diff === 0;
}

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlJson = (o: object) => b64url(new TextEncoder().encode(JSON.stringify(o)));

/** OAuth access token for the service account in SERVICE_ACCOUNT_KEY (the JSON key file Google gives you) */
async function accessToken(): Promise<string> {
  const raw = Deno.env.get("SERVICE_ACCOUNT_KEY");
  if (!raw) throw new Error("SERVICE_ACCOUNT_KEY not configured");
  let sa: { client_email: string; private_key: string };
  try { sa = JSON.parse(raw); } catch (e) { throw new Error(`SERVICE_ACCOUNT_KEY is not valid JSON: ${(e as Error).message}`); } // never log the key itself
  const pem = sa.private_key.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = `${b64urlJson({ alg: "RS256", typ: "JWT" })}.${b64urlJson({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", iat, exp: iat + 600 })}`;
  const signature = b64url(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned))));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
  });
  if (!res.ok) throw new Error(`Google sign-in failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).access_token;
}

async function record(body: Body) {
  const tab = TABS[body.tab];
  if (!tab) throw new Error(`Unknown tab "${body.tab}"`);
  const sheetId = Deno.env.get("GOOGLE_SHEETS_ID")?.trim();
  if (!sheetId) throw new Error("GOOGLE_SHEETS_ID not configured");
  const rows = (body.rows ?? []).filter((r) => tab.ref.test(String(r[0])));
  const remove = new Set((body.remove ?? []).filter((ref) => tab.ref.test(ref)));
  for (const r of rows) remove.delete(String(r[0])); // a row being written is never also removed

  const token = await accessToken();
  const call = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${API}/${encodeURIComponent(sheetId)}${path}`, { ...init, signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`Google Sheets request failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    return res.json();
  };

  const last = String.fromCharCode(64 + tab.head.length); // both tabs are under 26 columns
  const colA: unknown[][] = (await call(`/values/${encodeURIComponent(`'${tab.title}'!A:A`)}`)).values ?? [];
  const rowOf = new Map<string, number[]>(); // reference → 0-based sheet rows holding it
  colA.forEach((r, i) => { const ref = String(r?.[0] ?? "").trim(); if (i > 0 && tab.ref.test(ref)) rowOf.set(ref, [...(rowOf.get(ref) ?? []), i]); });

  // 1) header, and rows already on the sheet: overwrite in place (columns A to U only; staff notes from V onward stay)
  const updates: { range: string; values: Value[][] }[] = [];
  if (String(colA[0]?.[0] ?? "") !== tab.head[0]) updates.push({ range: `'${tab.title}'!A1:${last}1`, values: [[...tab.head]] });
  const drop: number[] = [];
  const append: Value[][] = [];
  for (const r of rows) {
    const at = rowOf.get(String(r[0]));
    if (!at) { append.push(r); continue; }
    updates.push({ range: `'${tab.title}'!A${at[0] + 1}:${last}${at[0] + 1}`, values: [r] });
    drop.push(...at.slice(1)); // duplicates of the same record
  }
  for (const ref of remove) drop.push(...(rowOf.get(ref) ?? []));
  if (updates.length) await call("/values:batchUpdate", { method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data: updates }) });

  // 2) removals bottom-up so the row numbers above stay valid
  if (drop.length) {
    const meta = await call("?fields=sheets.properties(title,sheetId)");
    const gid = meta.sheets?.find((s: { properties: { title: string } }) => s.properties.title === tab.title)?.properties.sheetId;
    if (gid == null) throw new Error(`Google Sheet has no tab named "${tab.title}"`);
    const requests = [...new Set(drop)].sort((a, b) => b - a).map((i) => ({ deleteDimension: { range: { sheetId: gid, dimension: "ROWS", startIndex: i, endIndex: i + 1 } } }));
    await call(":batchUpdate", { method: "POST", body: JSON.stringify({ requests }) });
  }

  // 3) new records last
  if (append.length) await call(`/values/${encodeURIComponent(`'${tab.title}'!A:${last}`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: "POST", body: JSON.stringify({ values: append }) });
  return { added: append.length, updated: rows.length - append.length, removed: drop.length };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await req.json()) as Body;
    const result = await record(body);
    console.log(`Recorded to ${TABS[body.tab].title}:`, result);
    return Response.json({ success: true, ...result });
  } catch (e) {
    console.error("Recording to Google Sheets failed:", e);
    return Response.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
});
