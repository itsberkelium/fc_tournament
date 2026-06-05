import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const players = await db.player.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ players });
}
