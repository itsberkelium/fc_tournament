import { z } from "zod";
import { NextResponse } from "next/server";

export const scoreSchema = z.object({
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
});

export const playerScoreSchema = scoreSchema.extend({
  playerName: z.string().min(1),
});

export const tournamentStartSchema = z.object({
  doubleLegs: z.boolean(),
  playoffEnabled: z.boolean(),
  playoffTeamCount: z.number().int().positive(),
});

export function validationError(error: z.ZodError): NextResponse {
  const message = error.issues.map((e) => e.message).join(", ");
  return NextResponse.json({ message }, { status: 400 });
}
