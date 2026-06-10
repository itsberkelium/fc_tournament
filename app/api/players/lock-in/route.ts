import { NextResponse } from "next/server";
import db from "@/lib/db";
import Teams from "@/lib/teams.json";
import { Team } from "@/types/Team";
import { lockInSchema, validationError } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = lockInSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const { playerName, teamId } = parsed.data;

    const lockSetting = await db.settings.findUnique({ where: { key: "registrationLocked" } });
    if (lockSetting?.value === "true") {
      return NextResponse.json({ message: "Kayıt şu an kapalı." }, { status: 403 });
    }

    const disabledTeam = await db.disabledTeam.findUnique({ where: { teamId } });
    if (disabledTeam) {
      return NextResponse.json({ message: "Bu takım seçilemez." }, { status: 403 });
    }

    const existingName = await db.player.findFirst({
      where: { playerName: { equals: playerName, mode: "insensitive" } },
    });
    if (existingName) {
      return NextResponse.json({ message: "Bu isimle zaten bir oyuncu kayıtlı." }, { status: 409 });
    }

    const existingTeam = await db.player.findFirst({
      where: { teamId: teamId }
    });

    // 2. If claimed, reject the lock-in
    if (existingTeam) {
      return NextResponse.json(
        { message: "Ah! Someone just locked in this team." },
        { status: 409 } // Conflict status
      );
    }

    const teams = Teams as Team[];
    const team = teams.find((item: Team) => item.id === teamId);

    if (!team) {
      return NextResponse.json({ message: "Selected team does not exist." }, { status: 404 });
    }

    const id = crypto.randomUUID();

    // 3. If available, save the player and lock the team
    const newPlayer = await db.player.create({
      data: { id, playerName, teamId, teamName: team.name }
    });

    return NextResponse.json({ success: true, player: newPlayer });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
