import { NextResponse } from "next/server";
import { getCart } from "@/lib/flows/bookings";
import { sessionId } from "@/lib/session";

/* header cart badge */
export async function GET() {
  try {
    const cart = await getCart(await sessionId());
    return NextResponse.json({ count: cart.length }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
