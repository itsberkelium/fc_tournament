import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { playerName, homeScore, awayScore } = await request.json();

  if (!playerName || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ message: "Eksik alan." }, { status: 400 });
  }

  const match = await db.match.findUnique({
    where: { id },
    include: {
      homePlayer: { select: { playerName: true } },
      awayPlayer: { select: { playerName: true } },
    },
  });

  if (!match) {
    return NextResponse.json({ message: "Maç bulunamadı." }, { status: 404 });
  }

  const isInMatch =
    match.homePlayer.playerName === playerName ||
    match.awayPlayer.playerName === playerName;

  if (!isInMatch) {
    return NextResponse.json({ message: "Bu maçı güncelleme yetkin yok." }, { status: 403 });
  }

  const updated = await db.match.update({
    where: { id },
    data: {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      isCompleted: true,
    },
  });

  return NextResponse.json({ success: true, match: updated });
}
