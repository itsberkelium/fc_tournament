"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Flag } from "@/components/flag";

export type MatchPlayer = {
  id: string;
  playerName: string;
  teamId: string;
  teamName: string;
  isDisqualified?: boolean;
};

export type Match = {
  id: string;
  round: number;
  isCompleted: boolean;
  isPlayoff: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homePlayer: MatchPlayer;
  awayPlayer: MatchPlayer;
};

type MatchCardProps = {
  match: Match;
  currentPlayerName?: string;
  onSave: (matchId: string, homeScore: number, awayScore: number) => Promise<boolean>;
};

export function MatchCard({ match, currentPlayerName, onSave }: MatchCardProps) {
  const [scoreInput, setScoreInput] = useState<{ home: string; away: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isMyMatch =
    !!currentPlayerName &&
    (match.homePlayer.playerName === currentPlayerName || match.awayPlayer.playerName === currentPlayerName);
  const isEditing = scoreInput !== null;

  function handleEdit() {
    setScoreInput({
      home: match.homeScore?.toString() ?? "",
      away: match.awayScore?.toString() ?? "",
    });
  }

  function handleCancel() {
    setScoreInput(null);
  }

  async function handleSave() {
    if (!scoreInput || scoreInput.home === "" || scoreInput.away === "") return;
    setIsSaving(true);
    try {
      const ok = await onSave(match.id, Number(scoreInput.home), Number(scoreInput.away));
      if (ok) setScoreInput(null);
    } finally {
      setIsSaving(false);
    }
  }

  const isDraw = scoreInput !== null && scoreInput.home !== "" && scoreInput.away !== "" && scoreInput.home === scoreInput.away;

  return (
    <div className={`px-4 py-3 space-y-2 ${isMyMatch ? "bg-primary/5" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <div className="text-right min-w-0">
            <div className="flex items-center justify-end gap-1.5">
              {match.homePlayer.isDisqualified && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">DSK</Badge>}
              <p className={`text-sm leading-none truncate ${isMyMatch && match.homePlayer.playerName === currentPlayerName ? "font-semibold" : ""}`}>
                {match.homePlayer.teamName}
              </p>
            </div>
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
                className="w-14 h-10 text-center text-base px-1"
                placeholder="0"
                value={scoreInput.home}
                onChange={(e) => setScoreInput((prev) => prev && ({ ...prev, home: e.target.value.replace(/\D/g, "") }))}
              />
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-14 h-10 text-center text-base px-1"
                placeholder="0"
                value={scoreInput.away}
                onChange={(e) => setScoreInput((prev) => prev && ({ ...prev, away: e.target.value.replace(/\D/g, "") }))}
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
            <div className="flex items-center gap-1.5">
              <p className={`text-sm leading-none truncate ${isMyMatch && match.awayPlayer.playerName === currentPlayerName ? "font-semibold" : ""}`}>
                {match.awayPlayer.teamName}
              </p>
              {match.awayPlayer.isDisqualified && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">DSK</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{match.awayPlayer.playerName}</p>
          </div>
        </div>
      </div>

      {/* Action row — only for my matches, hidden if either player is disqualified */}
      {isMyMatch && !match.homePlayer.isDisqualified && !match.awayPlayer.isDisqualified && (
        <div className="flex justify-center gap-2">
          {isEditing ? (
            <>
              <Button
                className="h-10 px-5 sm:h-8 sm:px-3"
                disabled={isSaving || scoreInput.home === "" || scoreInput.away === "" || (match.isPlayoff && isDraw)}
                onClick={handleSave}
              >
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button className="h-10 px-5 sm:h-8 sm:px-3" variant="outline" disabled={isSaving} onClick={handleCancel}>
                İptal
              </Button>
            </>
          ) : (
            <Button className="h-10 px-5 sm:h-8 sm:px-3" variant="outline" onClick={handleEdit}>
              {match.isCompleted ? "Skoru Düzenle" : "Skor Gir"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
