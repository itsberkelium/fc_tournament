"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getStoredPlayer, clearStoredPlayer } from "@/lib/player-storage";
import teams from "@/lib/teams.json";
import type { Team } from "@/types/Team";

const ALL_TEAMS = teams as Team[];

type PlayerInfo = {
  playerName: string;
  teamName: string;
  teamId: string;
};

type PageHeaderProps = {
  tournamentName: string;
  onPlayerLoaded?: (player: PlayerInfo) => void;
};

export function PageHeader({ tournamentName, onPlayerLoaded }: PageHeaderProps) {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerInfo | null>(null);

  useEffect(() => {
    const stored = getStoredPlayer();
    if (!stored) {
      router.replace("/login");
      return;
    }

    fetch(`/api/players/me?playerName=${encodeURIComponent(stored.playerName)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.exists || !data.hasTeam) {
          clearStoredPlayer();
          router.replace("/login");
          return;
        }
        const info: PlayerInfo = {
          playerName: data.player.playerName,
          teamName: data.player.teamName,
          teamId: data.player.teamId,
        };
        setPlayer(info);
        onPlayerLoaded?.(info);
      })
      .catch(() => {
        clearStoredPlayer();
        router.replace("/login");
      });
  }, [router, onPlayerLoaded]);

  const teamFlag = player ? ALL_TEAMS.find((t) => t.id === player.teamId)?.flag : null;

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <h1 className="text-lg font-bold tracking-tight">{tournamentName}</h1>

      {player && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold leading-none">{player.playerName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{player.teamName}</p>
          </div>
          {teamFlag ? (
            <Image
              src={`https://flagcdn.com/w80/${teamFlag}.png`}
              alt={player.teamName}
              width={40}
              height={27}
              className="rounded shadow-sm"
              unoptimized
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {player.playerName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
