import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const matches = await db.match.findMany({
    include: {
      homePlayer: { select: { id: true, playerName: true, teamId: true, teamName: true, isDisqualified: true } },
      awayPlayer: { select: { id: true, playerName: true, teamId: true, teamName: true, isDisqualified: true } },
    },
    orderBy: [{ round: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ matches });
}
