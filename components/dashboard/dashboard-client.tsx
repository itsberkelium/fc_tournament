"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/frontend/page-header";
import { PageNav } from "@/components/frontend/page-nav";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";
import { SquadModal } from "@/components/dashboard/squad-modal";
import { RecentMatchesFeed } from "@/components/dashboard/recent-matches-feed";
import { TournamentStatsCard } from "@/components/dashboard/tournament-stats-card";
import { usePlayerStore } from "@/lib/stores/player-store";
import { publicApi } from "@/lib/api";
import type { StandingRow, TournamentStats } from "@/lib/standings";
import type { RecentMatch } from "@/lib/api";
import type { PlayerRef } from "@/components/dashboard/squad-modal";

type DashboardClientProps = {
  initialStandings: StandingRow[];
  initialRecentMatches: RecentMatch[];
  initialStats: TournamentStats;
  tournamentName: string;
  tournamentStarted: boolean;
  playoffEnabled: boolean;
};

export function DashboardClient({
  initialStandings,
  initialRecentMatches,
  initialStats,
  tournamentName,
  tournamentStarted,
  playoffEnabled,
}: DashboardClientProps) {
  const [standings, setStandings] = useState(initialStandings);
  const [recentMatches, setRecentMatches] = useState(initialRecentMatches);
  const [stats, setStats] = useState(initialStats);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRef | null>(null);
  const { player } = usePlayerStore();

  const refreshData = useCallback(async () => {
    const data = await publicApi.getLeaderboard();
    if (data.standings) setStandings(data.standings);
    if (data.recentMatches) setRecentMatches(data.recentMatches);
    if (data.stats) setStats(data.stats);
  }, []);

  useEffect(() => {
    if (!tournamentStarted) return;
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [tournamentStarted, refreshData]);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader tournamentName={tournamentName} />
      <PageNav active="dashboard" showPlayoffs={playoffEnabled} />

      <main className="flex flex-1 flex-col p-6 max-w-4xl w-full mx-auto space-y-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Lig Tablosu</h2>
            {!tournamentStarted && (
              <span className="text-xs text-muted-foreground">Turnuva henüz başlamadı</span>
            )}
          </div>

          {standings.length === 0 ? (
            <div className="flex items-center justify-center py-16">
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
              onRowClick={(r: StandingRow) => setSelectedPlayer(r)}
            />
          )}
        </div>

        {tournamentStarted && (
          <TournamentStatsCard stats={stats} />
        )}

        {tournamentStarted && (
          <RecentMatchesFeed matches={recentMatches} />
        )}
      </main>

      <SquadModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}
