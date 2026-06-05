import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get("playerName");

    if (!playerName) {
      return NextResponse.json({ message: "playerName is required." }, { status: 400 });
    }

    const player = await db.player.findFirst({
      where: { playerName }
    });

    if (!player) {
      return NextResponse.json({ exists: false, hasTeam: false });
    }

    return NextResponse.json({
      exists: true,
      hasTeam: !!player.teamId,
      player
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
