import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const rows = await db.settings.findMany();
  const settings: Record<string, string> = {
    tournamentName: "EA FC 26 Ligi",
    registrationLocked: "false",
  };
  for (const row of rows) settings[row.key] = row.value;
  return NextResponse.json({ settings });
}
