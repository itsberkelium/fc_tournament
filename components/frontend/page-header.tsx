"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/lib/stores/player-store";
import teams from "@/lib/teams.json";
import type { Team } from "@/types/Team";

const ALL_TEAMS = teams as Team[];

export function PageHeader({ tournamentName }: { tournamentName: string }) {
  const router = useRouter();
  const { player, loadPlayer, clearPlayer } = usePlayerStore();

  useEffect(() => {
    loadPlayer(router);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teamFlag = player ? ALL_TEAMS.find((t) => t.id === player.teamId)?.flag : null;

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <h1 className="text-lg font-bold tracking-tight">{tournamentName}</h1>

      {player && (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => clearPlayer(router)}
          >
            Kullanıcı Değiştir
          </Button>
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
