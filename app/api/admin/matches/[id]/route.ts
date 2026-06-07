import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const { id } = await params;
  const { homeScore, awayScore } = await request.json();

  if (homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ message: "homeScore ve awayScore gerekli." }, { status: 400 });
  }

  const existing = await (db.match as any).findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "Maç bulunamadı." }, { status: 404 });

  const match = await (db.match as any).update({
    where: { id },
    data: { homeScore: Number(homeScore), awayScore: Number(awayScore), isCompleted: true },
  });

  // Auto-advance playoff bracket on first completion
  if (match.isPlayoff && match.bracketSlot !== null && match.bracketSlot >= 0 && !existing.isCompleted) {
    const slot = match.bracketSlot as number;
    const siblingSlot = slot % 2 === 0 ? slot + 1 : slot - 1;
    const nextRound = match.round + 1;
    const nextSlot = Math.floor(slot / 2);

    const sibling = await (db.match as any).findFirst({
      where: { isPlayoff: true, round: match.round, bracketSlot: siblingSlot },
    });

    if (sibling?.isCompleted) {
      const winner = (m: { homeScore: number; awayScore: number; homePlayerId: string; awayPlayerId: string }) =>
        m.homeScore >= m.awayScore ? m.homePlayerId : m.awayPlayerId;
      const loser = (m: { homeScore: number; awayScore: number; homePlayerId: string; awayPlayerId: string }) =>
        m.homeScore >= m.awayScore ? m.awayPlayerId : m.homePlayerId;

      const scores = { homeScore: Number(homeScore), awayScore: Number(awayScore), homePlayerId: match.homePlayerId, awayPlayerId: match.awayPlayerId };
      const myWinner = winner(scores);
      const siblingWinner = winner(sibling);
      const myLoser = loser(scores);
      const siblingLoser = loser(sibling);

      const homeWinner = slot < siblingSlot ? myWinner : siblingWinner;
      const awayWinner = slot < siblingSlot ? siblingWinner : myWinner;
      const homeLoser = slot < siblingSlot ? myLoser : siblingLoser;
      const awayLoser = slot < siblingSlot ? siblingLoser : myLoser;

      const nextExists = await (db.match as any).findFirst({
        where: { isPlayoff: true, round: nextRound, bracketSlot: nextSlot },
      });

      if (!nextExists) {
        await (db.match as any).create({
          data: {
            id: crypto.randomUUID(),
            homePlayerId: homeWinner,
            awayPlayerId: awayWinner,
            round: nextRound,
            isPlayoff: true,
            bracketSlot: nextSlot,
            isCompleted: false,
          },
        });
      }

      // When the next round is the final, also create the 3rd place match with losers
      const settingRow = await db.settings.findUnique({ where: { key: "playoffTeamCount" } });
      const teamCount = parseInt((settingRow as any)?.value ?? "4", 10);
      const totalRounds = Math.log2(teamCount);

      if (nextRound === totalRounds) {
        const thirdPlaceExists = await (db.match as any).findFirst({
          where: { isPlayoff: true, round: nextRound, bracketSlot: -1 },
        });
        if (!thirdPlaceExists) {
          await (db.match as any).create({
            data: {
              id: crypto.randomUUID(),
              homePlayerId: homeLoser,
              awayPlayerId: awayLoser,
              round: nextRound,
              isPlayoff: true,
              bracketSlot: -1,
              isCompleted: false,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ success: true, match });
}
