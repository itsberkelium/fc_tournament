"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/frontend/page-header";
import { PageNav } from "@/components/frontend/page-nav";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";
import type { StandingRow } from "@/lib/standings";

type DashboardClientProps = {
  initialStandings: StandingRow[];
  tournamentName: string;
  tournamentStarted: boolean;
};

export function DashboardClient({ initialStandings, tournamentName, tournamentStarted }: DashboardClientProps) {
  const [standings, setStandings] = useState(initialStandings);
  const [currentPlayerName, setCurrentPlayerName] = useState<string | undefined>();

  const refreshStandings = useCallback(async () => {
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    setStandings(data.standings ?? []);
  }, []);

  useEffect(() => {
    if (!tournamentStarted) return;
    const interval = setInterval(refreshStandings, 30000);
    return () => clearInterval(interval);
  }, [tournamentStarted, refreshStandings]);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        tournamentName={tournamentName}
        onPlayerLoaded={(p) => setCurrentPlayerName(p.playerName)}
      />
      <PageNav active="dashboard" />

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
          <LeaderboardTable standings={standings} currentPlayerName={currentPlayerName} />
        )}
      </main>
    </div>
  );
}
