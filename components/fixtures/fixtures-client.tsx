"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/frontend/page-header";
import { PageNav } from "@/components/frontend/page-nav";
import { FixtureToolbar } from "@/components/fixtures/fixture-toolbar";
import { MatchdaySection } from "@/components/fixtures/matchday-section";
import { usePlayerStore } from "@/lib/stores/player-store";
import { playerApi } from "@/lib/api";
import type { Match } from "@/components/fixtures/match-card";

type FixturesClientProps = {
  initialMatches: Match[];
  tournamentName: string;
  playoffEnabled: boolean;
};

export function FixturesClient({ initialMatches, tournamentName, playoffEnabled }: FixturesClientProps) {
  const [matches, setMatches] = useState(initialMatches);
  const [viewMode, setViewMode] = useState<"day" | "all">("day");
  const [myMatchesOnly, setMyMatchesOnly] = useState(false);
  const { player } = usePlayerStore();
  const currentPlayerName = player?.playerName;

  const matchdays = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);

  const currentMatchday =
    matchdays.find((d) => matches.filter((m) => m.round === d).some((m) => !m.isCompleted)) ??
    matchdays[matchdays.length - 1];

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const activeDay = selectedDay ?? currentMatchday;
  const dayIndex = matchdays.indexOf(activeDay);

  function filterMatches(list: Match[]) {
    return myMatchesOnly && currentPlayerName
      ? list.filter(
          (m) =>
            m.homePlayer.playerName === currentPlayerName ||
            m.awayPlayer.playerName === currentPlayerName
        )
      : list;
  }

  const handleSave = useCallback(async (matchId: string, homeScore: number, awayScore: number): Promise<boolean> => {
    if (!currentPlayerName) return false;
    const res = await playerApi.submitMatchScore(matchId, {
      playerName: currentPlayerName,
      homeScore,
      awayScore,
    });
    if (res.ok) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, homeScore, awayScore, isCompleted: true }
            : m
        )
      );
      return true;
    }
    return false;
  }, [currentPlayerName]);

  const tournamentStarted = matches.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader tournamentName={tournamentName} />
      <PageNav active="fixtures" showPlayoffs={playoffEnabled} />

      <main className="flex flex-1 flex-col max-w-2xl w-full mx-auto">
        {!tournamentStarted ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Turnuva başladığında fikstür burada görünecek.</p>
          </div>
        ) : (
          <>
            <FixtureToolbar
              viewMode={viewMode}
              myMatchesOnly={myMatchesOnly}
              onViewChange={setViewMode}
              onMyMatchesToggle={() => setMyMatchesOnly((v) => !v)}
            />

            {viewMode === "day" && (
              <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                <button
                  onClick={() => setSelectedDay(matchdays[dayIndex - 1])}
                  disabled={dayIndex <= 0}
                  className="text-sm px-2 py-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  ←
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{activeDay}. Maç Günü</span>
                  {activeDay === currentMatchday &&
                    matches.filter((m) => m.round === activeDay).some((m) => !m.isCompleted) && (
                      <Badge variant="default" className="text-xs">Güncel</Badge>
                    )}
                  {matches.filter((m) => m.round === activeDay).every((m) => m.isCompleted) && (
                    <Badge variant="secondary" className="text-xs">Tamamlandı</Badge>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDay(matchdays[dayIndex + 1])}
                  disabled={dayIndex >= matchdays.length - 1}
                  className="text-sm px-2 py-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  →
                </button>
              </div>
            )}

            <div className="flex flex-col px-6 py-4 space-y-6">
              {(viewMode === "day" ? [activeDay] : matchdays).map((day) => {
                const dayAllMatches = matches.filter((m) => m.round === day);
                const dayMatches = filterMatches(dayAllMatches);
                if (dayMatches.length === 0) return null;
                return (
                  <MatchdaySection
                    key={day}
                    day={day}
                    matches={dayMatches}
                    isCurrentDay={day === currentMatchday}
                    showHeader={viewMode === "all"}
                    currentPlayerName={currentPlayerName}
                    onSave={handleSave}
                  />
                );
              })}

              {myMatchesOnly &&
                filterMatches(viewMode === "day" ? matches.filter((m) => m.round === activeDay) : matches).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Bu görünümde maçın yok.</p>
                )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
