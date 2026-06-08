"use client";

import { usePlayerStore } from "@/lib/stores/player-store";
import { PageHeader } from "@/components/frontend/page-header";
import { PageNav } from "@/components/frontend/page-nav";
import { Flag } from "@/components/flag";
import { getFeederLabel, getThirdPlaceFeederLabel } from "@/lib/playoffs";

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
  bracket: {
    totalRounds: number;
    rounds: BracketRound[];
    thirdPlaceMatch: BracketMatch | null;
  };
};

export function PlayoffsClient({
  tournamentName,
  teamCount,
  leagueComplete,
  playoffStarted,
  bracket,
}: PlayoffsClientProps) {
  const { player } = usePlayerStore();
  const currentPlayerName = player?.playerName;
  const firstRoundMatchCount = bracket.rounds[0]?.matches.length ?? 1;

  function MatchCard({
    match,
    round,
    isThirdPlace = false,
  }: {
    match: BracketMatch;
    round: number;
    isThirdPlace?: boolean;
  }) {
    const isMyMatch =
      !!currentPlayerName &&
      (match.homePlayer?.playerName === currentPlayerName ||
        match.awayPlayer?.playerName === currentPlayerName);
    const homeIsWinner = match.isCompleted && match.winnerId === match.homePlayer?.id;
    const awayIsWinner = match.isCompleted && match.winnerId === match.awayPlayer?.id;
    const isFinal = !isThirdPlace && round === bracket.totalRounds;

    const homePlaceholderText = isThirdPlace
      ? getThirdPlaceFeederLabel(bracket.totalRounds, "home")
      : round === 1
        ? `${match.slot + 1}. Sıra${match.leagueNotDone ? "*" : ""}`
        : getFeederLabel(round, bracket.totalRounds, match.slot, "home");

    const awayPlaceholderText = isThirdPlace
      ? getThirdPlaceFeederLabel(bracket.totalRounds, "away")
      : round === 1
        ? `${teamCount - match.slot}. Sıra${match.leagueNotDone ? "*" : ""}`
        : getFeederLabel(round, bracket.totalRounds, match.slot, "away");

    function PlayerRow({
      p,
      isWinner,
      score,
      ph,
    }: {
      p: MatchPlayer | null;
      isWinner: boolean;
      score: number | null;
      ph: string;
    }) {
      const faded = match.isCompleted && !isWinner;

      if (!p || match.isPlaceholder) {
        return (
          <div className="flex items-center gap-2 px-2.5 py-2 min-h-[40px]">
            <div className="w-5 h-3.5 rounded-sm bg-muted/60 shrink-0" />
            <p className="text-xs text-muted-foreground italic leading-tight truncate">{ph}</p>
          </div>
        );
      }

      return (
        <div
          className={`flex items-center gap-2 px-2.5 py-2 min-h-[40px] ${isWinner ? "bg-primary/5" : ""}`}
        >
          <div className={faded ? "opacity-40" : ""}>
            <Flag teamId={p.teamId} teamName={p.teamName} />
          </div>
          <div className={`flex-1 min-w-0 ${faded ? "opacity-40" : ""}`}>
            <p className={`text-xs leading-none truncate ${isWinner ? "font-semibold" : "font-medium"}`}>
              {p.teamName}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{p.playerName}</p>
          </div>
          {match.isCompleted && score !== null && (
            <span className={`text-sm font-bold tabular-nums shrink-0 pl-1 ${faded ? "opacity-40" : ""}`}>
              {score}
            </span>
          )}
        </div>
      );
    }

    return (
      <div
        className={`rounded-md border overflow-hidden ${
          isMyMatch ? "border-primary/60 ring-1 ring-primary/20" : "border-border"
        }`}
      >
        <PlayerRow
          p={match.homePlayer}
          isWinner={homeIsWinner}
          score={match.homeScore}
          ph={homePlaceholderText}
        />
        <div className="border-t border-border" />
        <PlayerRow
          p={match.awayPlayer}
          isWinner={awayIsWinner}
          score={match.awayScore}
          ph={awayPlaceholderText}
        />
        {isFinal && match.isCompleted && match.winnerId && (
          <div className="border-t border-border py-1.5 text-center bg-amber-500/10">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              🏆{" "}
              {match.winnerId === match.homePlayer?.id
                ? match.homePlayer?.playerName
                : match.awayPlayer?.playerName}
            </span>
          </div>
        )}
      </div>
    );
  }

  function RoundLabel({ label }: { label: string }) {
    return (
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center mb-2">
        {label}
      </p>
    );
  }

  function Connector({ count, dashed = false }: { count: number; dashed?: boolean }) {
    const borderClass = dashed
      ? "border-dashed border-muted-foreground/30"
      : "border-border";
    return (
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${firstRoundMatchCount}, 1fr)` }}
      >
        {Array.from({ length: count }).map((_, i) => {
          const colSpan = firstRoundMatchCount / count;
          return (
            <div
              key={i}
              style={{ gridColumn: `span ${colSpan}` }}
              className="flex h-8"
            >
              <div className={`flex-1 border-l border-b ${borderClass}`} />
              <div className={`flex-1 border-r border-b ${borderClass}`} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader tournamentName={tournamentName} />
      <PageNav active="playoffs" showPlayoffs />

      <main className="flex flex-1 flex-col max-w-3xl w-full mx-auto px-4 py-6 gap-6">
        {!playoffStarted && (
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {leagueComplete
                ? "Lig tamamlandı. Playoff yakında başlayacak."
                : "Lig devam ediyor. Tamamlandığında playoff başlayacak."}
            </p>
          </div>
        )}

        {bracket.rounds.length > 0 && (
          <div className="overflow-x-auto -mx-4 px-4">
            <div style={{ minWidth: `${Math.max(firstRoundMatchCount * 160, 300)}px` }}>
              {bracket.rounds.map(({ round, label, matches }, roundIndex) => {
                const colSpan = firstRoundMatchCount / matches.length;
                const isSemiFinal = round === bracket.totalRounds - 1;

                return (
                  <div key={round}>
                    {/* Connector from previous round */}
                    {roundIndex > 0 && <Connector count={matches.length} />}

                    <RoundLabel label={label} />

                    {/* Match cards */}
                    <div
                      className="grid gap-2"
                      style={{ gridTemplateColumns: `repeat(${firstRoundMatchCount}, 1fr)` }}
                    >
                      {matches.map((match) => (
                        <div key={match.slot} style={{ gridColumn: `span ${colSpan}` }}>
                          <MatchCard match={match} round={round} />
                        </div>
                      ))}
                    </div>

                    {/* 3rd place match after semi-finals */}
                    {isSemiFinal && bracket.thirdPlaceMatch && (
                      <div className="mt-0">
                        <Connector count={1} dashed />
                        <RoundLabel label="3. Yer Maçı" />
                        <div
                          className="grid"
                          style={{ gridTemplateColumns: `repeat(${firstRoundMatchCount}, 1fr)` }}
                        >
                          <div
                            style={{ gridColumn: `span ${firstRoundMatchCount}` }}
                            className="px-[20%]"
                          >
                            <MatchCard
                              match={bracket.thirdPlaceMatch}
                              round={round}
                              isThirdPlace
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {bracket.rounds.some((r) =>
          r.matches.some((m) => m.isPlaceholder && m.leagueNotDone)
        ) && (
          <p className="text-xs text-muted-foreground text-center">
            * Lig tamamlandığında sıralar netleşecek.
          </p>
        )}
      </main>
    </div>
  );
}
