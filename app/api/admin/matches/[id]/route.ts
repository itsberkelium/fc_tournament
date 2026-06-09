import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyStaffRequest } from "@/lib/admin-guard";
import { advancePlayoffBracket, updateBracketAfterScoreChange } from "@/lib/playoff-bracket";
import { scoreSchema, validationError } from "@/lib/validation";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = verifyStaffRequest(request);
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await db.match.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Maç bulunamadı." }, { status: 404 });

    await db.match.update({
      where: { id },
      data: { homeScore: null, awayScore: null, isCompleted: false },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: "Sunucu hatası." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = verifyStaffRequest(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = scoreSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { homeScore, awayScore } = parsed.data;

  try {
    const existing = await db.match.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Maç bulunamadı." }, { status: 404 });

    if (existing.isPlayoff && homeScore === awayScore) {
      return NextResponse.json({ message: "Playoff maçları beraberlikle bitemez." }, { status: 400 });
    }

    const match = await db.match.update({
      where: { id },
      data: { homeScore, awayScore, isCompleted: true },
    });

    if (!existing.isCompleted) {
      await advancePlayoffBracket(existing, homeScore, awayScore);
    } else if (existing.isPlayoff && existing.bracketSlot !== null && existing.bracketSlot >= 0) {
      // Match was already completed — check if the winner changed and propagate downstream
      const oldWinnerId = existing.homeScore! >= existing.awayScore!
        ? existing.homePlayerId
        : existing.awayPlayerId;
      const newWinnerId = homeScore >= awayScore ? existing.homePlayerId : existing.awayPlayerId;
      if (oldWinnerId !== newWinnerId) {
        await updateBracketAfterScoreChange(existing, oldWinnerId, newWinnerId);
      }
    }

    return NextResponse.json({ success: true, match });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ message: "Çakışma hatası." }, { status: 409 });
    return NextResponse.json({ message: "Sunucu hatası." }, { status: 500 });
  }
}
