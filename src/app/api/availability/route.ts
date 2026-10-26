import { NextResponse, type NextRequest } from "next/server";
import { dayStates, monthSummary } from "@/lib/availability";
import { courtById } from "@/lib/catalog";
import { readToken } from "@/lib/links";
import { sessionId } from "@/lib/session";

/* GET ?court=p1&month=2026-11  → per-day open counts (date step)
   GET ?court=p1&date=2026-11-03 → per-hour states (time step)
   &claim=<token> treats the claimant's held hour as open */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const court = await courtById(q.get("court") ?? "");
  if (!court) return NextResponse.json({ error: "Unknown court" }, { status: 400 });
  const t = q.get("claim") ? readToken(q.get("claim")!) : null;
  const claim = t && t.k === "claim" ? t.id : null;
  const session = await sessionId();
  const month = q.get("month"), date = q.get("date");
  if (month && /^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ days: await monthSummary(court.id, month, session, claim) }, { headers: { "Cache-Control": "no-store" } });
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ hours: await dayStates(court.id, date, session, claim) }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ error: "Pass month or date" }, { status: 400 });
}
