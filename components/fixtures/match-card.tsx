"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag } from "@/components/flag";

export type MatchPlayer = {
  id: string;
  playerName: string;
  teamId: string;
  teamName: string;
};

export type Match = {
  id: string;
  round: number;
  isCompleted: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homePlayer: MatchPlayer;
  awayPlayer: MatchPlayer;
};

type ScoreInput = { home: string; away: string };

type MatchCardProps = {
  match: Match;
  currentPlayerName?: string;
  scoreInput?: ScoreInput;
  isSaving: boolean;
  onScoreChange: (matchId: string, field: "home" | "away", value: string) => void;
  onSave: (matchId: string) => void;
  onEdit: (match: Match) => void;
  onCancelEdit: (matchId: string) => void;
};

export function MatchCard({
  match,
  currentPlayerName,
  scoreInput,
  isSaving,
  onScoreChange,
  onSave,
  onEdit,
  onCancelEdit,
}: MatchCardProps) {
  const isMyMatch =
    !!currentPlayerName &&
    (match.homePlayer.playerName === currentPlayerName || match.awayPlayer.playerName === currentPlayerName);
  const isEditing = scoreInput !== undefined;

  return (
    <div className={`px-4 py-3 space-y-2 ${isMyMatch ? "bg-primary/5" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <div className="text-right min-w-0">
            <p className={`text-sm leading-none truncate ${isMyMatch && match.homePlayer.playerName === currentPlayerName ? "font-semibold" : ""}`}>
              {match.homePlayer.teamName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{match.homePlayer.playerName}</p>
          </div>
          <Flag teamId={match.homePlayer.teamId} teamName={match.homePlayer.teamName} />
        </div>

        {/* Score / inputs */}
        <div className="shrink-0 text-center">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-12 text-center px-1"
                placeholder="0"
                value={scoreInput.home}
                onChange={(e) => onScoreChange(match.id, "home", e.target.value.replace(/\D/g, ""))}
              />
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-12 text-center px-1"
                placeholder="0"
                value={scoreInput.away}
                onChange={(e) => onScoreChange(match.id, "away", e.target.value.replace(/\D/g, ""))}
              />
            </div>
          ) : match.isCompleted ? (
            <span className="text-sm font-bold tabular-nums w-16 inline-block">
              {match.homeScore} – {match.awayScore}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground font-medium w-16 inline-block">vs</span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
          <Flag teamId={match.awayPlayer.teamId} teamName={match.awayPlayer.teamName} />
          <div className="min-w-0">
            <p className={`text-sm leading-none truncate ${isMyMatch && match.awayPlayer.playerName === currentPlayerName ? "font-semibold" : ""}`}>
              {match.awayPlayer.teamName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{match.awayPlayer.playerName}</p>
          </div>
        </div>
      </div>

      {/* Action row — only for my matches */}
      {isMyMatch && (
        <div className="flex justify-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                disabled={isSaving || scoreInput.home === "" || scoreInput.away === ""}
                onClick={() => onSave(match.id)}
              >
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button size="sm" variant="outline" disabled={isSaving} onClick={() => onCancelEdit(match.id)}>
                İptal
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onEdit(match)}>
              {match.isCompleted ? "Skoru Düzenle" : "Skor Gir"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
