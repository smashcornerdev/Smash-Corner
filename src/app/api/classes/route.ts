import { NextResponse } from "next/server";
import { bookableClasses } from "@/lib/flows/classes";

/* GET → classes open on the Book page's Class / event tab (fetched the first time that tab is opened) */
export async function GET() {
  return NextResponse.json({ classes: await bookableClasses() }, { headers: { "Cache-Control": "no-store" } });
}
