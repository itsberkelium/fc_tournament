"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/lib/stores/player-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/frontend/page-header";
import { PageNav } from "@/components/frontend/page-nav";
import { Flag } from "@/components/flag";
import { SquadModal } from "@/components/dashboard/squad-modal";
import { getFeederLabel, getThirdPlaceFeederLabel } from "@/lib/playoffs";
import { playerApi } from "@/lib/api";
import type { PlayerRef } from "@/components/dashboard/squad-modal";

type MatchPlayer = { id: string; playerName: string; teamId: string; teamName: string; isDisqualified?: boolean };

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

const CARD_WIDTH = 224;
const CONNECTOR_WIDTH = 40;
const BASE_SLOT_HEIGHT = 120;
const LABEL_HEIGHT = 32;

// ── Round connector ────────────────────────────────────────────────────────────

function RoundConnector({ outputCount, totalHeight, dashed = false }: { outputCount: number; totalHeight: number; dashed?: boolean }) {
  const color = dashed ? "hsl(var(--border) / 0.4)" : "hsl(var(--border))";
  const cellHeight = totalHeight / outputCount;
  return (
    <div style={{ width: CONNECTOR_WIDTH, flexShrink: 0 }}>
      <div style={{ height: LABEL_HEIGHT }} />
      {Array.from({ length: outputCount }).map((_, i) => (
        <div key={i} style={{ position: "relative", height: cellHeight }}>
          <div style={{ position: "absolute", top: "calc(25% - 0.5px)", left: 0, width: "50%", height: 1, background: color }} />
          <div style={{ position: "absolute", top: "calc(75% - 0.5px)", left: 0, width: "50%", height: 1, background: color }} />
          <div style={{ position: "absolute", left: "calc(50% - 0.5px)", top: "25%", height: "50%", width: 1, background: color }} />
          <div style={{ position: "absolute", top: "calc(50% - 0.5px)", left: "50%", right: 0, height: 1, background: color }} />
        </div>
      ))}
    </div>
  );
}

// ── List view card ─────────────────────────────────────────────────────────────

type ListMatchCardProps = {
  match: BracketMatch;
  round: number;
  totalRounds: number;
  teamCount: number;
  currentPlayerName?: string;
  isThirdPlace?: boolean;
  onPlayerClick?: (player: MatchPlayer) => void;
  onSave: (matchId: string, homeScore: number, awayScore: number) => Promise<boolean>;
};

function ListMatchCard({ match, round, totalRounds, teamCount, currentPlayerName, isThirdPlace = false, onPlayerClick, onSave }: ListMatchCardProps) {
  const [scoreInput, setScoreInput] = useState<{ home: string; away: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isMyMatch =
    !!currentPlayerName &&
    (match.homePlayer?.playerName === currentPlayerName || match.awayPlayer?.playerName === currentPlayerName);
  const homeIsWinner = match.isCompleted && match.winnerId === match.homePlayer?.id;
  const awayIsWinner = match.isCompleted && match.winnerId === match.awayPlayer?.id;
  const isEditing = scoreInput !== null;
  const isDraw = scoreInput !== null && scoreInput.home !== "" && scoreInput.away !== "" && scoreInput.home === scoreInput.away;

  const homePlaceholderText = isThirdPlace
    ? getThirdPlaceFeederLabel(totalRounds, "home")
    : round === 1
      ? `${match.slot + 1}. Sıra${match.leagueNotDone ? "*" : ""}`
      : getFeederLabel(round, totalRounds, match.slot, "home");

  const awayPlaceholderText = isThirdPlace
    ? getThirdPlaceFeederLabel(totalRounds, "away")
    : round === 1
      ? `${teamCount - match.slot}. Sıra${match.leagueNotDone ? "*" : ""}`
      : getFeederLabel(round, totalRounds, match.slot, "away");

  const canEnterScore =
    isMyMatch &&
    !match.isPlaceholder &&
    match.id !== null &&
    !match.homePlayer?.isDisqualified &&
    !match.awayPlayer?.isDisqualified;

  function handleEdit() {
    setScoreInput({ home: match.homeScore?.toString() ?? "", away: match.awayScore?.toString() ?? "" });
  }

  function handleCancel() {
    setScoreInput(null);
  }

  async function handleSave() {
    if (!match.id || !scoreInput || scoreInput.home === "" || scoreInput.away === "") return;
    setIsSaving(true);
    try {
      const ok = await onSave(match.id, Number(scoreInput.home), Number(scoreInput.away));
      if (ok) setScoreInput(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={`rounded-md border border-border p-3 space-y-2 ${isMyMatch ? "bg-primary/5" : ""}`}>
      <div className="flex items-center gap-2">
        {/* Home */}
        <div
          className={`flex items-center gap-2 flex-1 justify-end min-w-0 ${onPlayerClick && match.homePlayer && !match.isPlaceholder ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}`}
          onClick={() => match.homePlayer && !match.isPlaceholder && onPlayerClick?.(match.homePlayer)}
        >
          <div className="text-right min-w-0">
            {match.homePlayer && !match.isPlaceholder ? (
              <>
                <p className={`text-sm leading-none truncate ${homeIsWinner ? "font-bold" : ""} ${match.isCompleted && !homeIsWinner ? "opacity-50" : ""}`}>
                  {match.homePlayer.teamName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{match.homePlayer.playerName}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">{homePlaceholderText}</p>
            )}
          </div>
          {match.homePlayer && !match.isPlaceholder && (
            <Flag teamId={match.homePlayer.teamId} teamName={match.homePlayer.teamName} />
          )}
        </div>

        {/* Score */}
        <div className="shrink-0 w-20 text-center">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-10 text-center px-1"
                placeholder="0"
                value={scoreInput.home}
                onChange={(e) => setScoreInput((prev) => prev && ({ ...prev, home: e.target.value.replace(/\D/g, "") }))}
              />
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-10 text-center px-1"
                placeholder="0"
                value={scoreInput.away}
                onChange={(e) => setScoreInput((prev) => prev && ({ ...prev, away: e.target.value.replace(/\D/g, "") }))}
              />
            </div>
          ) : match.isCompleted ? (
            <span className="text-sm font-bold tabular-nums">{match.homeScore} – {match.awayScore}</span>
          ) : (
            <span className="text-xs text-muted-foreground font-medium">
              {match.isPlaceholder && match.leagueNotDone ? "Tahmini" : "vs"}
            </span>
          )}
        </div>

        {/* Away */}
        <div
          className={`flex items-center gap-2 flex-1 justify-start min-w-0 ${onPlayerClick && match.awayPlayer && !match.isPlaceholder ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}`}
          onClick={() => match.awayPlayer && !match.isPlaceholder && onPlayerClick?.(match.awayPlayer)}
        >
          {match.awayPlayer && !match.isPlaceholder && (
            <Flag teamId={match.awayPlayer.teamId} teamName={match.awayPlayer.teamName} />
          )}
          <div className="min-w-0">
            {match.awayPlayer && !match.isPlaceholder ? (
              <>
                <p className={`text-sm leading-none truncate ${awayIsWinner ? "font-bold" : ""} ${match.isCompleted && !awayIsWinner ? "opacity-50" : ""}`}>
                  {match.awayPlayer.teamName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{match.awayPlayer.playerName}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">{awayPlaceholderText}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action row */}
      {canEnterScore && (
        <div className="flex justify-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                disabled={isSaving || scoreInput.home === "" || scoreInput.away === "" || isDraw}
                onClick={handleSave}
              >
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button size="sm" variant="outline" disabled={isSaving} onClick={handleCancel}>
                İptal
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={handleEdit}>
              {match.isCompleted ? "Skoru Düzenle" : "Skor Gir"}
            </Button>
          )}
        </div>
      )}

      {match.isCompleted && match.winnerId && !isEditing && (
        <div className="text-center">
          <Badge
            variant={!isThirdPlace && round === totalRounds ? "default" : "secondary"}
            className="text-xs"
          >
            {!isThirdPlace && round === totalRounds ? "🏆 " : ""}
            {isThirdPlace ? "3. Takım: " : "Galip: "}
            {match.winnerId === match.homePlayer?.id ? match.homePlayer?.playerName : match.awayPlayer?.playerName}
          </Badge>
        </div>
      )}
    </div>
  );
}

// ── Bracket view card ──────────────────────────────────────────────────────────

type BracketMatchCardProps = {
  match: BracketMatch;
  round: number;
  totalRounds: number;
  teamCount: number;
  currentPlayerName?: string;
  isThirdPlace?: boolean;
  onPlayerClick?: (player: MatchPlayer) => void;
};

function BracketMatchCard({ match, round, totalRounds, teamCount, currentPlayerName, isThirdPlace = false, onPlayerClick }: BracketMatchCardProps) {
  const isMyMatch =
    !!currentPlayerName &&
    (match.homePlayer?.playerName === currentPlayerName || match.awayPlayer?.playerName === currentPlayerName);
  const homeIsWinner = match.isCompleted && match.winnerId === match.homePlayer?.id;
  const awayIsWinner = match.isCompleted && match.winnerId === match.awayPlayer?.id;
  const isFinal = !isThirdPlace && round === totalRounds;

  const homePlaceholderText = isThirdPlace
    ? getThirdPlaceFeederLabel(totalRounds, "home")
    : round === 1
      ? `${match.slot + 1}. Sıra${match.leagueNotDone ? "*" : ""}`
      : getFeederLabel(round, totalRounds, match.slot, "home");

  const awayPlaceholderText = isThirdPlace
    ? getThirdPlaceFeederLabel(totalRounds, "away")
    : round === 1
      ? `${teamCount - match.slot}. Sıra${match.leagueNotDone ? "*" : ""}`
      : getFeederLabel(round, totalRounds, match.slot, "away");

  function PlayerRow({ p, isWinner, score, ph }: { p: MatchPlayer | null; isWinner: boolean; score: number | null; ph: string }) {
    const faded = match.isCompleted && !isWinner;
    const clickable = !!onPlayerClick && !!p && !match.isPlaceholder;
    if (!p || match.isPlaceholder) {
      return (
        <div className="flex items-center gap-2.5 px-3 py-2.5 min-h-[48px]">
          <div className="w-6 h-4 rounded-sm bg-muted/60 shrink-0" />
          <p className="text-sm text-muted-foreground italic leading-tight truncate">{ph}</p>
        </div>
      );
    }
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 min-h-[48px] ${isWinner ? "bg-primary/5" : ""} ${clickable ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}`}
        onClick={clickable ? () => onPlayerClick!(p) : undefined}
      >
        <div className={faded ? "opacity-40" : ""}>
          <Flag teamId={p.teamId} teamName={p.teamName} />
        </div>
        <div className={`flex-1 min-w-0 ${faded ? "opacity-40" : ""}`}>
          <p className={`text-sm leading-none truncate ${isWinner ? "font-semibold" : "font-medium"}`}>{p.teamName}</p>
          <p className="text-xs text-muted-foreground truncate mt-1">{p.playerName}</p>
        </div>
        {match.isCompleted && score !== null && (
          <span className={`text-base font-bold tabular-nums shrink-0 pl-1 ${faded ? "opacity-40" : ""}`}>{score}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full rounded-md border overflow-hidden ${isMyMatch ? "border-primary/60 ring-1 ring-primary/20" : "border-border"}`}>
      <PlayerRow p={match.homePlayer} isWinner={homeIsWinner} score={match.homeScore} ph={homePlaceholderText} />
      <div className="border-t border-border" />
      <PlayerRow p={match.awayPlayer} isWinner={awayIsWinner} score={match.awayScore} ph={awayPlaceholderText} />
      {isFinal && match.isCompleted && match.winnerId && (
        <div className="border-t border-border py-2 text-center bg-amber-500/10">
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            🏆{" "}
            {match.winnerId === match.homePlayer?.id ? match.homePlayer?.playerName : match.awayPlayer?.playerName}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main client component ──────────────────────────────────────────────────────

export function PlayoffsClient({ tournamentName, teamCount, leagueComplete, playoffStarted, bracket }: PlayoffsClientProps) {
  const { player } = usePlayerStore();
  const currentPlayerName = player?.playerName;
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRef | null>(null);

  const handlePlayerClick = useCallback((p: MatchPlayer) => {
    setSelectedPlayer({ playerId: p.id, playerName: p.playerName, teamId: p.teamId, teamName: p.teamName });
  }, []);

  const firstRoundMatchCount = bracket.rounds[0]?.matches.length ?? 1;
  const totalHeight = firstRoundMatchCount * BASE_SLOT_HEIGHT;

  const [view, setView] = useState<"bracket" | "list">("bracket");

  useEffect(() => {
    const saved = localStorage.getItem("playoffs-view");
    if (saved === "list" || saved === "bracket") setView(saved);
  }, []);

  function switchView(v: "bracket" | "list") {
    setView(v);
    localStorage.setItem("playoffs-view", v);
  }

  const handleSave = useCallback(async (matchId: string, homeScore: number, awayScore: number): Promise<boolean> => {
    if (!currentPlayerName) return false;
    const res = await playerApi.submitMatchScore(matchId, { playerName: currentPlayerName, homeScore, awayScore });
    if (res.ok) {
      router.refresh();
      return true;
    }
    return false;
  }, [currentPlayerName, router]);

  // Build bracket columns
  const bracketColumns: React.ReactNode[] = [];
  bracket.rounds.forEach(({ round, label, matches }, roundIndex) => {
    if (roundIndex > 0) {
      bracketColumns.push(<RoundConnector key={`conn-${roundIndex}`} outputCount={matches.length} totalHeight={totalHeight} />);
    }
    const slotHeight = totalHeight / matches.length;
    bracketColumns.push(
      <div key={`round-${round}`} style={{ width: CARD_WIDTH, flexShrink: 0 }}>
        <div style={{ height: LABEL_HEIGHT }} className="flex items-center justify-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        </div>
        {matches.map((match) => (
          <div key={match.slot} style={{ height: slotHeight, display: "flex", alignItems: "center", padding: "4px 0" }}>
            <BracketMatchCard match={match} round={round} totalRounds={bracket.totalRounds} teamCount={teamCount} currentPlayerName={currentPlayerName} onPlayerClick={handlePlayerClick} />
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
              {leagueComplete ? "Lig tamamlandı. Playoff yakında başlayacak." : "Lig devam ediyor. Tamamlandığında playoff başlayacak."}
            </p>
          </div>
        )}

        {bracket.rounds.length > 0 && (
          <>
            {/* View toggle */}
            <div className="flex justify-end">
              <div className="inline-flex rounded-md border border-border overflow-hidden text-sm">
                <button
                  onClick={() => switchView("list")}
                  className={`px-3 py-1.5 transition-colors cursor-pointer ${view === "list" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  Liste
                </button>
                <div className="w-px bg-border" />
                <button
                  onClick={() => switchView("bracket")}
                  className={`px-3 py-1.5 transition-colors cursor-pointer ${view === "bracket" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  Turnuva
                </button>
              </div>
            </div>

            {/* Bracket view */}
            {view === "bracket" && (
              <>
                <div className="overflow-x-auto -mx-4 px-4">
                  <div style={{ display: "flex", alignItems: "flex-start", paddingRight: 16, paddingBottom: 24 }}>
                    {bracketColumns}
                  </div>
                </div>
                {bracket.thirdPlaceMatch && (
                  <div className="pt-5 border-t border-dashed border-border/50">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-3">Üçüncülük Maçı</p>
                    <div style={{ width: "100%", maxWidth: 300, margin: "0 auto" }}>
                      <BracketMatchCard match={bracket.thirdPlaceMatch} round={bracket.totalRounds} totalRounds={bracket.totalRounds} teamCount={teamCount} currentPlayerName={currentPlayerName} isThirdPlace onPlayerClick={handlePlayerClick} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* List view */}
            {view === "list" && (
              <div className="flex flex-col gap-6 max-w-2xl w-full mx-auto">
                {bracket.rounds.map(({ round, label, matches }) => (
                  <>
                    <div key={round} className="space-y-3">
                      <h2 className="text-sm font-semibold">{label}</h2>
                      <div className="space-y-2">
                        {matches.map((match) => (
                          <ListMatchCard
                            key={`${round}-${match.slot}`}
                            match={match}
                            round={round}
                            totalRounds={bracket.totalRounds}
                            teamCount={teamCount}
                            currentPlayerName={currentPlayerName}
                            onPlayerClick={handlePlayerClick}
                            onSave={handleSave}
                          />
                        ))}
                      </div>
                    </div>
                    {round === bracket.totalRounds - 1 && bracket.thirdPlaceMatch && (
                      <div key="third-place" className="space-y-3">
                        <h2 className="text-sm font-semibold">Üçüncülük Maçı</h2>
                        <div className="space-y-2">
                          <ListMatchCard
                            match={bracket.thirdPlaceMatch}
                            round={bracket.totalRounds}
                            totalRounds={bracket.totalRounds}
                            teamCount={teamCount}
                            currentPlayerName={currentPlayerName}
                            isThirdPlace
                            onPlayerClick={handlePlayerClick}
                            onSave={handleSave}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ))}
              </div>
            )}
          </>
        )}

        {bracket.rounds.some((r) => r.matches.some((m) => m.isPlaceholder && m.leagueNotDone)) && (
          <p className="text-xs text-muted-foreground text-center">* Lig tamamlandığında sıralar netleşecek.</p>
        )}
      </main>

      <SquadModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}
