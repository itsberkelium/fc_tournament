import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";

const DEFAULTS: Record<string, string> = {
  tournamentName: "EA FC 26 Ligi",
  registrationLocked: "false",
};

export async function GET(request: NextRequest) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const rows = await db.settings.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) settings[row.key] = row.value;

  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const body = await request.json();
  const allowed = Object.keys(DEFAULTS);

  for (const [key, value] of Object.entries(body)) {
    if (!allowed.includes(key) || typeof value !== "string") continue;
    await db.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json({ success: true });
}
