import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export async function GET() {
  const settings = await getSettings({ registrationLocked: "false" });
  return NextResponse.json({ settings });
}
