"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/frontend/page-header";
import { PageNav } from "@/components/frontend/page-nav";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";
import { SquadModal } from "@/components/dashboard/squad-modal";
import { usePlayerStore } from "@/lib/stores/player-store";
import { publicApi } from "@/lib/api";
import type { StandingRow } from "@/lib/standings";

type DashboardClientProps = {
  initialStandings: StandingRow[];
  tournamentName: string;
  tournamentStarted: boolean;
  playoffEnabled: boolean;
};

export function DashboardClient({ initialStandings, tournamentName, tournamentStarted, playoffEnabled }: DashboardClientProps) {
  const [standings, setStandings] = useState(initialStandings);
  const [selectedRow, setSelectedRow] = useState<StandingRow | null>(null);
  const { player } = usePlayerStore();

  const refreshStandings = useCallback(async () => {
    const data = await publicApi.getLeaderboard();
    setStandings(data.standings ?? []);
  }, []);

  useEffect(() => {
    if (!tournamentStarted) return;
    const interval = setInterval(refreshStandings, 30000);
    return () => clearInterval(interval);
  }, [tournamentStarted, refreshStandings]);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader tournamentName={tournamentName} />
      <PageNav active="dashboard" showPlayoffs={playoffEnabled} />

      <main className="flex flex-1 flex-col p-6 max-w-4xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Lig Tablosu</h2>
          {!tournamentStarted && (
            <span className="text-xs text-muted-foreground">Turnuva henüz başlamadı</span>
          )}
        </div>

        {standings.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              {tournamentStarted
                ? "Henüz tamamlanan maç yok."
                : "Turnuva başladığında tablo burada görünecek."}
            </p>
          </div>
        ) : (
          <LeaderboardTable
            standings={standings}
            currentPlayerName={player?.playerName}
            onRowClick={setSelectedRow}
          />
        )}
      </main>

      <SquadModal row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  );
}
