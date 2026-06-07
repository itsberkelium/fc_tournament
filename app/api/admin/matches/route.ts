import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const matches = await (db.match as any).findMany({
    where: { isPlayoff: false },
    include: {
      homePlayer: { select: { playerName: true, teamName: true } },
      awayPlayer: { select: { playerName: true, teamName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ matches });
}
