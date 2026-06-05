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

  const match = await db.match.update({
    where: { id },
    data: {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      isCompleted: true,
    },
  });

  return NextResponse.json({ success: true, match });
}
