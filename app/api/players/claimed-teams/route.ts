import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const [players, disabledTeams] = await Promise.all([
    db.player.findMany({ select: { teamId: true } }),
    db.disabledTeam.findMany({ select: { teamId: true } }),
  ]);

  return NextResponse.json({
    claimedTeamIds: players.map((p) => p.teamId),
    disabledTeamIds: disabledTeams.map((d) => d.teamId),
  });
}
