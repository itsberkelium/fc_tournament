import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { playerScoreSchema, validationError } from "@/lib/validation";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = playerScoreSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { playerName, homeScore, awayScore } = parsed.data;

  try {
    const match = await db.match.findUnique({
      where: { id },
      include: {
        homePlayer: { select: { playerName: true, canEnterScore: true, isDisqualified: true } },
        awayPlayer: { select: { playerName: true, canEnterScore: true, isDisqualified: true } },
      },
    });

    if (!match) return NextResponse.json({ message: "Maç bulunamadı." }, { status: 404 });

    const homeMatch = match.homePlayer.playerName.toLowerCase() === playerName.toLowerCase();
    const awayMatch = match.awayPlayer.playerName.toLowerCase() === playerName.toLowerCase();
    const isInMatch = homeMatch || awayMatch;

    if (!isInMatch) return NextResponse.json({ message: "Bu maçı güncelleme yetkin yok." }, { status: 403 });

    if (match.homePlayer.isDisqualified || match.awayPlayer.isDisqualified) {
      return NextResponse.json({ message: "Bu maçın skoru girilemez." }, { status: 403 });
    }

    const submittingPlayer = homeMatch ? match.homePlayer : match.awayPlayer;
    if (!submittingPlayer.canEnterScore) {
      return NextResponse.json({ message: "Skor girişi izniniz yok." }, { status: 403 });
    }

    const updated = await db.match.update({
      where: { id },
      data: { homeScore, awayScore, isCompleted: true },
    });

    return NextResponse.json({ success: true, match: updated });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ message: "Çakışma hatası." }, { status: 409 });
    return NextResponse.json({ message: "Sunucu hatası." }, { status: 500 });
  }
}
