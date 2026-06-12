"use client";

import type { TournamentStats } from "@/lib/standings";

type Props = { stats: TournamentStats };

export function TournamentStatsCard({ stats }: Props) {
  if (stats.totalGoals === 0 && !stats.biggestWin) return null;

  return (
    <div>
      <h2 className="text-base font-semibold mb-3">Turnuva İstatistikleri</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatItem label="Toplam Gol" value={String(stats.totalGoals)} />
        <StatItem label="Gol Yenmeyen Maç" value={String(stats.cleanSheets)} />
        {stats.biggestWin && (
          <StatItem
            label="En Büyük Fark"
            value={`${stats.biggestWin.homeScore}–${stats.biggestWin.awayScore}`}
            sub={`${stats.biggestWin.homeTeamName} – ${stats.biggestWin.awayTeamName}`}
          />
        )}
        {stats.highestScoring && (
          <StatItem
            label="En Gollü Maç"
            value={`${stats.highestScoring.homeScore}–${stats.highestScoring.awayScore}`}
            sub={`${stats.highestScoring.homeTeamName} – ${stats.highestScoring.awayTeamName}`}
          />
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-0.5 leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
    </div>
  );
}
