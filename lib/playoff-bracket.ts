import db from "@/lib/db";
import type { Match } from "@/prisma/generated";
import { getTotalRounds } from "@/lib/playoffs";

function winnerId(m: { homeScore: number; awayScore: number; homePlayerId: string; awayPlayerId: string }) {
  return m.homeScore >= m.awayScore ? m.homePlayerId : m.awayPlayerId;
}

function loserId(m: { homeScore: number; awayScore: number; homePlayerId: string; awayPlayerId: string }) {
  return m.homeScore >= m.awayScore ? m.awayPlayerId : m.homePlayerId;
}

/**
 * When an already-completed playoff match has its score corrected and the winner
 * changes, update the downstream bracket: swap the old winner out of the next-round
 * match and put the new winner in. Also fixes the third-place match if the updated
 * match was a semi-final.
 */
export async function updateBracketAfterScoreChange(
  match: Match,
  oldWinnerId: string,
  newWinnerId: string
): Promise<void> {
  const slot = match.bracketSlot;
  if (slot === null || slot < 0) return;

  const oldLoserId = oldWinnerId === match.homePlayerId ? match.awayPlayerId : match.homePlayerId;
  const newLoserId = newWinnerId === match.homePlayerId ? match.awayPlayerId : match.homePlayerId;

  const nextRound = match.round + 1;
  const nextSlot = Math.floor(slot / 2);

  // Update winner in next-round match
  const nextMatch = await db.match.findFirst({
    where: { isPlayoff: true, round: nextRound, bracketSlot: nextSlot },
  });

  if (nextMatch) {
    const winnerUpdate: Record<string, string> = {};
    if (nextMatch.homePlayerId === oldWinnerId) winnerUpdate.homePlayerId = newWinnerId;
    else if (nextMatch.awayPlayerId === oldWinnerId) winnerUpdate.awayPlayerId = newWinnerId;
    if (Object.keys(winnerUpdate).length > 0) {
      await db.match.update({ where: { id: nextMatch.id }, data: winnerUpdate });
    }
  }

  // If this was a semi-final, also update the loser in the third-place match
  const settingRow = await db.settings.findUnique({ where: { key: "playoffTeamCount" } });
  const teamCount = parseInt(settingRow?.value ?? "4", 10);
  const totalRounds = getTotalRounds(teamCount);

  if (nextRound === totalRounds) {
    const thirdPlace = await db.match.findFirst({
      where: { isPlayoff: true, round: totalRounds, bracketSlot: -1 },
    });
    if (thirdPlace) {
      const loserUpdate: Record<string, string> = {};
      if (thirdPlace.homePlayerId === oldLoserId) loserUpdate.homePlayerId = newLoserId;
      else if (thirdPlace.awayPlayerId === oldLoserId) loserUpdate.awayPlayerId = newLoserId;
      if (Object.keys(loserUpdate).length > 0) {
        await db.match.update({ where: { id: thirdPlace.id }, data: loserUpdate });
      }
    }
  }
}

export async function advancePlayoffBracket(
  existing: Match,
  homeScore: number,
  awayScore: number
): Promise<void> {
  const slot = existing.bracketSlot;
  if (!existing.isPlayoff || slot === null || slot < 0) return;

  const siblingSlot = slot % 2 === 0 ? slot + 1 : slot - 1;
  const nextRound = existing.round + 1;
  const nextSlot = Math.floor(slot / 2);

  const sibling = await db.match.findFirst({
    where: { isPlayoff: true, round: existing.round, bracketSlot: siblingSlot },
  });

  if (!sibling || !sibling.isCompleted || sibling.homeScore === null || sibling.awayScore === null) return;

  const current = { homeScore, awayScore, homePlayerId: existing.homePlayerId, awayPlayerId: existing.awayPlayerId };
  const siblingScores = { homeScore: sibling.homeScore, awayScore: sibling.awayScore, homePlayerId: sibling.homePlayerId, awayPlayerId: sibling.awayPlayerId };

  const myWinner = winnerId(current);
  const siblingWinner = winnerId(siblingScores);
  const myLoser = loserId(current);
  const siblingLoser = loserId(siblingScores);

  const homeWinner = slot < siblingSlot ? myWinner : siblingWinner;
  const awayWinner = slot < siblingSlot ? siblingWinner : myWinner;
  const homeLoser = slot < siblingSlot ? myLoser : siblingLoser;
  const awayLoser = slot < siblingSlot ? siblingLoser : myLoser;

  const nextExists = await db.match.findFirst({
    where: { isPlayoff: true, round: nextRound, bracketSlot: nextSlot },
  });

  if (!nextExists) {
    await db.match.create({
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

  const settingRow = await db.settings.findUnique({ where: { key: "playoffTeamCount" } });
  const teamCount = parseInt(settingRow?.value ?? "4", 10);
  const totalRounds = getTotalRounds(teamCount);

  if (nextRound === totalRounds) {
    const thirdPlaceExists = await db.match.findFirst({
      where: { isPlayoff: true, round: nextRound, bracketSlot: -1 },
    });
    if (!thirdPlaceExists) {
      await db.match.create({
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
