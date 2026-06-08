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

// Renders the bracket connector between two rounds.
//
// Each output match spans `colSpan` columns. Within that span, the two
// feeder match centers are always at 25 % and 75 % of the span width
// (because each feeder occupies exactly half the span with equal padding).
// Four lines are drawn:
//   ① left feeder stub  — vertical, from top down to the midpoint (at 25 %)
//   ② right feeder stub — vertical, from top down to the midpoint (at 75 %)
//   ③ horizontal bar    — at the midpoint, connecting ① and ②
//   ④ output stub       — vertical, from the midpoint down to the next card (at 50 %)
function BracketConnector({
  outputCount,
  totalColumns,
  height = 48,
  dashed = false,
}: {
  outputCount: number;
  totalColumns: number;
  height?: number;
  dashed?: boolean;
}) {
  const color = dashed ? "hsl(var(--border) / 0.4)" : "hsl(var(--border))";
  const borderStyle = dashed ? "dashed" : "solid";

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${totalColumns}, 1fr)` }}
    >
      {Array.from({ length: outputCount }).map((_, i) => {
        const colSpan = totalColumns / outputCount;
        return (
          <div
            key={i}
            style={{ gridColumn: `span ${colSpan}`, position: "relative", height }}
          >
            {/* ① left feeder stub */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: "50%",
                left: "calc(25% - 0.5px)",
                width: 1,
                background: color,
              }}
            />
            {/* ② right feeder stub */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: "50%",
                left: "calc(75% - 0.5px)",
                width: 1,
                background: color,
              }}
            />
            {/* ③ horizontal bar */}
            <div
              style={{
                position: "absolute",
                top: "calc(50% - 0.5px)",
                left: "25%",
                right: "25%",
                height: 1,
                background: color,
                borderTop: `1px ${borderStyle} ${color}`,
              }}
            />
            {/* ④ output stub */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                bottom: 0,
                left: "calc(50% - 0.5px)",
                width: 1,
                background: color,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

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
            <p
              className={`text-xs leading-none truncate ${isWinner ? "font-semibold" : "font-medium"}`}
            >
              {p.teamName}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{p.playerName}</p>
          </div>
          {match.isCompleted && score !== null && (
            <span
              className={`text-sm font-bold tabular-nums shrink-0 pl-1 ${faded ? "opacity-40" : ""}`}
            >
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
                return (
                  <div key={round}>
                    {roundIndex > 0 && (
                      <BracketConnector
                        outputCount={matches.length}
                        totalColumns={firstRoundMatchCount}
                      />
                    )}

                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center mb-2">
                      {label}
                    </p>

                    <div
                      className="grid"
                      style={{ gridTemplateColumns: `repeat(${firstRoundMatchCount}, 1fr)` }}
                    >
                      {matches.map((match) => (
                        <div
                          key={match.slot}
                          style={{ gridColumn: `span ${colSpan}` }}
                          className="px-1"
                        >
                          <MatchCard match={match} round={round} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Third place match shown below the main bracket */}
              {bracket.thirdPlaceMatch && bracket.totalRounds >= 2 && (
                <div className="mt-8 pt-5 border-t border-dashed border-border/50">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center mb-2">
                    3. Yer Maçı
                  </p>
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
                        round={bracket.totalRounds}
                        isThirdPlace
                      />
                    </div>
                  </div>
                </div>
              )}
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
