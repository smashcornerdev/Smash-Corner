import { NextResponse, type NextRequest } from "next/server";
import { equipmentFree } from "@/lib/availability";

/* GET ?date=2026-11-03&hours=9,10 → free quantity per item for those hours */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const hours = (req.nextUrl.searchParams.get("hours") ?? "").split(",").map(Number).filter((h) => Number.isInteger(h));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Bad date" }, { status: 400 });
  return NextResponse.json({ free: await equipmentFree(date, hours) }, { headers: { "Cache-Control": "no-store" } });
}
