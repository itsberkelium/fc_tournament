"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getStoredPlayer, clearStoredPlayer } from "@/lib/player-storage";

type PlayerInfo = {
  playerName: string;
  teamName: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredPlayer();

    if (!stored) {
      router.replace("/login");
      return;
    }

    fetch(`/api/players/me?playerName=${encodeURIComponent(stored.playerName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.exists || !data.hasTeam) {
          clearStoredPlayer();
          router.replace("/login");
          return;
        }
        setPlayer({ playerName: data.player.playerName, teamName: data.player.teamName });
      })
      .catch(() => {
        clearStoredPlayer();
        router.replace("/login");
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-bold tracking-tight">EA FC 26 Ligi</h1>

        {player && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{player.playerName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{player.teamName}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {player.playerName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Lig tablosu yakında burada olacak.</p>
      </main>
    </div>
  );
}
