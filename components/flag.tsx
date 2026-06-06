import Image from "next/image";
import teams from "@/lib/teams.json";
import type { Team } from "@/types/Team";

const ALL_TEAMS = teams as Team[];

type FlagProps = {
  teamId: string;
  teamName: string;
  size?: number;
};

export function Flag({ teamId, teamName, size = 28 }: FlagProps) {
  const team = ALL_TEAMS.find((t) => t.id === teamId);
  if (!team) return null;
  return (
    <Image
      src={`https://flagcdn.com/w80/${team.flag}.png`}
      alt={teamName}
      width={size}
      height={Math.round(size * 0.67)}
      className="rounded-sm shadow-sm shrink-0"
      unoptimized
    />
  );
}
