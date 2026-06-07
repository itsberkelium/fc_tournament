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
