import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function POST(request: NextRequest) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const existingMatches = await db.match.count();
  if (existingMatches > 0) {
    return NextResponse.json({ message: "Turnuva zaten başlatıldı." }, { status: 409 });
  }

  const players = await db.player.findMany({ orderBy: { createdAt: "asc" } });

  if (players.length < 2) {
    return NextResponse.json({ message: "Turnuva için en az 2 oyuncu gerekli." }, { status: 400 });
  }

  // Generate all round-robin pairs
  const matches = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push({
        id: crypto.randomUUID(),
        homePlayerId: players[i].id,
        awayPlayerId: players[j].id,
        round: 1,
        isCompleted: false,
      });
    }
  }

  await db.match.createMany({ data: matches });

  return NextResponse.json({ success: true, matchCount: matches.length });
}
