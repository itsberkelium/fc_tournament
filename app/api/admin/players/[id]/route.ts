import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const { id } = await params;

  await db.player.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
