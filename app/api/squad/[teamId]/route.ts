import { NextRequest, NextResponse } from "next/server";
import squads from "@/lib/squads.json";

type SquadPlayer = { pos: string; name: string; club: string };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const squad = (squads as Record<string, SquadPlayer[]>)[teamId] ?? [];
  return NextResponse.json({ squad });
}
