import { NextResponse } from "next/server";
import db from "@/lib/db";
import Teams from "@/lib/teams.json";
import { Team } from "@/types/Team";

export async function POST(request: Request) {
  try {
    const { playerName, teamId } = await request.json();

    if (!playerName || !teamId) {
      return NextResponse.json(
        { message: "playerName and teamId must be strings." },
        { status: 400 }
      );
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
