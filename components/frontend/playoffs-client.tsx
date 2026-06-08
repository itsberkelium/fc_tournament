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

const CARD_WIDTH = 220;
const CONNECTOR_WIDTH = 40;
const BASE_SLOT_HEIGHT = 110; // must fit a ~82px tall match card
const LABEL_HEIGHT = 32;

// Horizontal connector column between two adjacent rounds.
//
// Each connector cell spans 2 feeder slots, so feeder centers land at
// exactly 25% and 75% of the cell height — identical math to the
// vertical bracket, just rotated 90°.
//   left stubs  — horizontal lines at 25 % and 75 % (from feeder cards)
//   vertical bar — connects the two stubs at x=50%
//   output stub  — horizontal line at 50 % going right (to output card)
function RoundConnector({
  outputCount,
  totalHeight,
  dashed = false,
}: {
  outputCount: number;
  totalHeight: number;
  dashed?: boolean;
}) {
  const color = dashed ? "hsl(var(--border) / 0.4)" : "hsl(var(--border))";
  const cellHeight = totalHeight / outputCount;

  return (
    <div style={{ width: CONNECTOR_WIDTH, flexShrink: 0 }}>
      <div style={{ height: LABEL_HEIGHT }} />
      {Array.from({ length: outputCount }).map((_, i) => (
        <div key={i} style={{ position: "relative", height: cellHeight }}>
          {/* left stub — top feeder */}
          <div
            style={{
              position: "absolute",
              top: "calc(25% - 0.5px)",
              left: 0,
              width: "50%",
              height: 1,
              background: color,
            }}
          />
          {/* left stub — bottom feeder */}
          <div
            style={{
              position: "absolute",
              top: "calc(75% - 0.5px)",
              left: 0,
              width: "50%",
              height: 1,
              background: color,
            }}
          />
          {/* vertical bar */}
          <div
            style={{
              position: "absolute",
              left: "calc(50% - 0.5px)",
              top: "25%",
              height: "50%",
              width: 1,
              background: color,
            }}
          />
          {/* output stub */}
          <div
            style={{
              position: "absolute",
              top: "calc(50% - 0.5px)",
              left: "50%",
              right: 0,
              height: 1,
              background: color,
            }}
          />
        </div>
      ))}
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
  const totalHeight = firstRoundMatchCount * BASE_SLOT_HEIGHT;

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
        className={`w-full rounded-md border overflow-hidden ${
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

  // Build the bracket columns (rounds interleaved with connectors)
  const columns: React.ReactNode[] = [];
  bracket.rounds.forEach(({ round, label, matches }, roundIndex) => {
    if (roundIndex > 0) {
      columns.push(
        <RoundConnector
          key={`conn-${roundIndex}`}
          outputCount={matches.length}
          totalHeight={totalHeight}
        />
      );
    }
    const slotHeight = totalHeight / matches.length;
    columns.push(
      <div key={`round-${round}`} style={{ width: CARD_WIDTH, flexShrink: 0 }}>
        <div
          style={{ height: LABEL_HEIGHT }}
          className="flex items-center justify-center"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
        </div>
        {matches.map((match) => (
          <div
            key={match.slot}
            style={{ height: slotHeight, display: "flex", alignItems: "center", padding: "3px 0" }}
          >
            <MatchCard match={match} round={round} />
          </div>
        ))}
      </div>
    );
  });

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader tournamentName={tournamentName} />
      <PageNav active="playoffs" showPlayoffs />

      <main className="flex flex-1 flex-col max-w-5xl w-full mx-auto px-4 py-6 gap-6">
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
            <div style={{ display: "flex", alignItems: "flex-start", paddingRight: 16, paddingBottom: 24 }}>
              {columns}
            </div>
          </div>
        )}

        {bracket.thirdPlaceMatch && bracket.totalRounds >= 2 && (
          <div className="pt-5 border-t border-dashed border-border/50">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center mb-2">
              3. Yer Maçı
            </p>
            <div style={{ maxWidth: CARD_WIDTH, margin: "0 auto" }}>
              <MatchCard
                match={bracket.thirdPlaceMatch}
                round={bracket.totalRounds}
                isThirdPlace
              />
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
