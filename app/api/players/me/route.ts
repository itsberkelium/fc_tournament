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
      where: { playerName: { equals: playerName, mode: "insensitive" } },
    });

    if (!player) {
      const lockSetting = await db.settings.findUnique({ where: { key: "registrationLocked" } });
      const registrationLocked = lockSetting?.value === "true";
      return NextResponse.json({ exists: false, hasTeam: false, registrationLocked });
    }

    if (player.isDisabled) {
      return NextResponse.json({ message: "Hesabınız devre dışı bırakıldı." }, { status: 403 });
    }

    return NextResponse.json({
      exists: true,
      hasTeam: !!player.teamId,
      player,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
