"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ExportSectionProps = {
  tournamentName: string;
};

export function ExportSection({ tournamentName }: ExportSectionProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const [leaderboardRes, fixturesRes] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch("/api/fixtures"),
      ]);
      const { standings } = await leaderboardRes.json();
      const { matches } = await fixturesRes.json();

      const standingsCsv = [
        ["Sıra", "Takım", "Oyuncu", "O", "G", "B", "M", "AG", "YG", "Av", "P"],
        ...standings.map((r: {
          teamName: string; playerName: string; played: number; won: number; drawn: number;
          lost: number; goalsFor: number; goalsAgainst: number; goalDiff: number; points: number;
        }, i: number) => [
          i + 1, r.teamName, r.playerName, r.played, r.won, r.drawn,
          r.lost, r.goalsFor, r.goalsAgainst, r.goalDiff, r.points,
        ]),
      ].map((row) => row.join(",")).join("\n");

      const fixturesCsv = [
        ["Maç Günü", "Ev Sahibi Takım", "Ev Sahibi Oyuncu", "Deplasman Takım", "Deplasman Oyuncu", "Ev Skoru", "Deplasman Skoru"],
        ...matches.map((m: {
          round: number; homePlayer: { teamName: string; playerName: string };
          awayPlayer: { teamName: string; playerName: string };
          homeScore: number | null; awayScore: number | null;
        }) => [
          m.round, m.homePlayer.teamName, m.homePlayer.playerName,
          m.awayPlayer.teamName, m.awayPlayer.playerName,
          m.homeScore ?? "", m.awayScore ?? "",
        ]),
      ].map((row) => row.join(",")).join("\n");

      const combined = `PUAN TABLOSU\n${standingsCsv}\n\nFİKSTÜR\n${fixturesCsv}`;
      const blob = new Blob([combined], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournamentName.replace(/\s+/g, "_")}_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Veri Dışa Aktar</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Puan tablosunu ve fikstürü CSV olarak indir.</p>
      </div>
      <Button variant="outline" onClick={handleExport} disabled={isExporting}>
        {isExporting ? "Hazırlanıyor..." : "CSV İndir"}
      </Button>
    </section>
  );
}
