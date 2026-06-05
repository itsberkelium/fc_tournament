import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const matchCount = await db.match.count();
  return NextResponse.json({ started: matchCount > 0 });
}
