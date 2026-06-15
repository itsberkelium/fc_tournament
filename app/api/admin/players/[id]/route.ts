import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const { id } = await params;

  try {
    await db.player.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "P2025") return NextResponse.json({ message: "Oyuncu bulunamadı." }, { status: 404 });
    return NextResponse.json({ message: "Sunucu hatası." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { action, canEnterScore } = body;

  try {
    const player = await db.player.findUnique({ where: { id } });
    if (!player) return NextResponse.json({ message: "Oyuncu bulunamadı." }, { status: 404 });

    // Update permission flags
    if (action === "updatePermissions") {
      const updated = await db.player.update({
        where: { id },
        data: { canEnterScore: canEnterScore ?? player.canEnterScore },
      });
      return NextResponse.json({ success: true, player: updated });
    }

    // Toggle disabled
    if (action === "toggleDisabled") {
      const updated = await db.player.update({
        where: { id },
        data: { isDisabled: !player.isDisabled },
      });
      return NextResponse.json({ success: true, player: updated });
    }

    // Disqualify — irreversible; auto-complete all pending matches with 3-0 to opponent
    if (action === "disqualify") {
      if (player.isDisqualified) {
        return NextResponse.json({ message: "Oyuncu zaten diskalifiye edildi." }, { status: 400 });
      }

      const pendingMatches = await db.match.findMany({
        where: {
          isCompleted: false,
          OR: [{ homePlayerId: id }, { awayPlayerId: id }],
        },
        include: {
          homePlayer: { select: { playerName: true } },
          awayPlayer: { select: { playerName: true } },
        },
      });

      // Complete each pending match with the disqualified player losing 0-3
      await Promise.all(
        pendingMatches.map((m) => {
          const playerIsHome = m.homePlayerId === id;
          return db.match.update({
            where: { id: m.id },
            data: {
              homeScore: playerIsHome ? 0 : 3,
              awayScore: playerIsHome ? 3 : 0,
              isCompleted: true,
            },
          });
        })
      );

      const updated = await db.player.update({
        where: { id },
        data: { isDisqualified: true, isDisabled: true },
      });

      const affectedMatches = pendingMatches.map((m) => ({
        id: m.id,
        opponentName: m.homePlayerId === id ? m.awayPlayer.playerName : m.homePlayer.playerName,
      }));

      return NextResponse.json({ success: true, player: updated, affectedMatches });
    }

    // Reset — clears disqualified/disabled status and all match scores
    if (action === "reset") {
      await db.match.updateMany({
        where: { OR: [{ homePlayerId: id }, { awayPlayerId: id }] },
        data: { homeScore: null, awayScore: null, isCompleted: false },
      });

      const updated = await db.player.update({
        where: { id },
        data: { isDisqualified: false, isDisabled: false, canEnterScore: true },
      });
      return NextResponse.json({ success: true, player: updated });
    }

    return NextResponse.json({ message: "Geçersiz işlem." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ message: "Sunucu hatası." }, { status: 500 });
  }
}
