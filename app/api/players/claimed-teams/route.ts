import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const players = await db.player.findMany({
    select: { teamId: true },
  });

  return NextResponse.json({ claimedTeamIds: players.map((p) => p.teamId) });
}
