import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { getSettings } from "@/lib/settings";

const ALLOWED_KEYS = ["tournamentName", "registrationLocked"];

export async function GET(request: NextRequest) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const settings = await getSettings({ registrationLocked: "false" });
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.includes(key) || typeof value !== "string") continue;
    await db.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json({ success: true });
}
