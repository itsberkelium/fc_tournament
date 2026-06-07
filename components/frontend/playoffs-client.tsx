"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/frontend/page-header";
import { PageNav } from "@/components/frontend/page-nav";
import { Flag } from "@/components/flag";

type MatchPlayer = { id: string; playerName: string; teamId: string; teamName: string };

type BracketMatch = {
  slot: number;
  id: string | null;
  homePlayer: MatchPlayer | null;
  awayPlayer: MatchPlayer | null;
  homeScore: number | null;
  awayScore: number | null;
  isCompleted: boolean;
  isPlaceholder: boolean;
  leagueNotDone?: boolean;
  winnerId: string | null;
};

type BracketRound = { round: number; label: string; matches: BracketMatch[] };

type PlayoffsClientProps = {
  tournamentName: string;
  teamCount: number;
  leagueComplete: boolean;
  playoffStarted: boolean;
  bracket: { totalRounds: number; rounds: BracketRound[] };
};

export function PlayoffsClient({ tournamentName, teamCount, leagueComplete, playoffStarted, bracket }: PlayoffsClientProps) {
  const [currentPlayerName, setCurrentPlayerName] = useState<string | undefined>();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader tournamentName={tournamentName} onPlayerLoaded={(p) => setCurrentPlayerName(p.playerName)} />
      <PageNav active="playoffs" showPlayoffs />

      <main className="flex flex-1 flex-col max-w-2xl w-full mx-auto px-6 py-6 space-y-6">
        {!playoffStarted && (
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {leagueComplete
                ? "Lig tamamlandı. Playoff yakında başlayacak."
                : "Lig devam ediyor. Tamamlandığında playoff başlayacak."}
            </p>
          </div>
        )}

        {bracket.rounds.map(({ round, label, matches }) => (
          <div key={round} className="space-y-3">
            <h2 className="text-sm font-semibold">{label}</h2>
            <div className="space-y-2">
              {matches.map((match) => {
                const isMyMatch = !!currentPlayerName && (
                  match.homePlayer?.playerName === currentPlayerName ||
                  match.awayPlayer?.playerName === currentPlayerName
                );
                const homeIsWinner = match.isCompleted && match.winnerId === match.homePlayer?.id;
                const awayIsWinner = match.isCompleted && match.winnerId === match.awayPlayer?.id;

                return (
                  <div key={`${round}-${match.slot}`} className={`rounded-md border border-border p-3 ${isMyMatch ? "bg-primary/5" : ""}`}>
                    <div className="flex items-center gap-2">
                      {/* Home */}
                      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="text-right min-w-0">
                          {match.homePlayer ? (
                            <>
                              <p className={`text-sm leading-none truncate ${homeIsWinner ? "font-bold" : ""} ${match.isCompleted && !homeIsWinner ? "opacity-50" : ""}`}>
                                {match.homePlayer.teamName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{match.homePlayer.playerName}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              {match.isPlaceholder ? `${match.slot + 1}. Sıra${match.leagueNotDone ? "*" : ""}` : "TBD"}
                            </p>
                          )}
                        </div>
                        {match.homePlayer && (
                          <Flag teamId={match.homePlayer.teamId} teamName={match.homePlayer.teamName} />
                        )}
                      </div>

                      {/* Score */}
                      <div className="shrink-0 w-20 text-center">
                        {match.isCompleted ? (
                          <span className="text-sm font-bold tabular-nums">{match.homeScore} – {match.awayScore}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">
                            {match.isPlaceholder && match.leagueNotDone ? "Tahmini" : "vs"}
                          </span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                        {match.awayPlayer && (
                          <Flag teamId={match.awayPlayer.teamId} teamName={match.awayPlayer.teamName} />
                        )}
                        <div className="min-w-0">
                          {match.awayPlayer ? (
                            <>
                              <p className={`text-sm leading-none truncate ${awayIsWinner ? "font-bold" : ""} ${match.isCompleted && !awayIsWinner ? "opacity-50" : ""}`}>
                                {match.awayPlayer.teamName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{match.awayPlayer.playerName}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              {match.isPlaceholder ? `${teamCount - match.slot}. Sıra${match.leagueNotDone ? "*" : ""}` : "TBD"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Winner */}
                    {match.isCompleted && match.winnerId && (
                      <div className="mt-2 text-center">
                        <Badge variant={round === bracket.totalRounds ? "default" : "secondary"} className="text-xs">
                          {round === bracket.totalRounds ? "🏆 " : ""}Galip: {match.winnerId === match.homePlayer?.id ? match.homePlayer?.playerName : match.awayPlayer?.playerName}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {bracket.rounds.some((r) => r.matches.some((m) => m.isPlaceholder && m.leagueNotDone)) && (
          <p className="text-xs text-muted-foreground text-center">* Lig tamamlandığında sıralar netleşecek.</p>
        )}
      </main>
    </div>
  );
}
