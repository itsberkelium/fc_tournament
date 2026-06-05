"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getStoredPlayer,
  getDraftState,
  setDraftState,
  clearDraftState,
} from "@/lib/player-storage";
import teams from "@/lib/teams.json";
import type { Team } from "@/types/Team";

const MAX_ROLLS = 3;
const ALL_TEAMS = teams as Team[];

export default function DraftPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState<string>("");
  const [rollCount, setRollCount] = useState(0);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>(ALL_TEAMS);
  const [isLockingIn, setIsLockingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  useEffect(() => {
    const player = getStoredPlayer();
    if (player) setPlayerName(player.playerName);

    const draft = getDraftState();
    setRollCount(draft.rollCount);
    if (draft.currentTeamId) {
      const team = ALL_TEAMS.find((t) => t.id === draft.currentTeamId) ?? null;
      setCurrentTeam(team);
    }

    fetch("/api/players/claimed-teams")
      .then((res) => res.json())
      .then((data) => {
        const claimed: string[] = data.claimedTeamIds ?? [];
        setAvailableTeams(ALL_TEAMS.filter((t) => !claimed.includes(t.id)));
      })
      .catch(() => {
        // Fall back to full pool on error
      })
      .finally(() => setIsLoadingTeams(false));
  }, []);

  function handleRoll() {
    if (availableTeams.length === 0) {
      setError("Tüm takımlar alındı!");
      return;
    }

    setIsRolling(true);
    setError(null);

    setTimeout(() => {
      const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
      const newCount = rollCount + 1;

      setCurrentTeam(randomTeam);
      setRollCount(newCount);
      setDraftState({ rollCount: newCount, currentTeamId: randomTeam.id });
      setIsRolling(false);
    }, 600);
  }

  async function handleLockIn() {
    if (!currentTeam || !playerName) return;

    setIsLockingIn(true);
    setError(null);

    try {
      const res = await fetch("/api/players/lock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, teamId: currentTeam.id }),
      });

      if (res.ok) {
        clearDraftState();
        router.replace("/dashboard");
        return;
      }

      const data = await res.json();

      if (res.status === 409) {
        // Team was just taken between roll and lock-in — remove it from pool and refund the roll
        setAvailableTeams((prev) => prev.filter((t) => t.id !== currentTeam.id));
        const refundedCount = Math.max(0, rollCount - 1);
        setRollCount(refundedCount);
        setCurrentTeam(null);
        setDraftState({ rollCount: refundedCount, currentTeamId: null });
        setError("Bu takım az önce başkası tarafından alındı. Tekrar çekiliş yap.");
      } else {
        setError(data?.message ?? "Bir hata oluştu. Tekrar dene.");
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar dene.");
    } finally {
      setIsLockingIn(false);
    }
  }

  const rollsLeft = MAX_ROLLS - rollCount;
  const canRoll = rollsLeft > 0 && !isLockingIn && !isLoadingTeams && availableTeams.length > 0;
  const canLockIn = !!currentTeam && !isRolling && !isLockingIn;
  const isForcedLockIn = rollCount >= MAX_ROLLS && !!currentTeam;

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Çekiliş</h1>
          <p className="text-muted-foreground text-sm">Milli takımını belirle ve seç</p>
        </div>

        {/* Player badge */}
        {playerName && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
              {playerName}
            </Badge>
          </div>
        )}

        {/* Team card */}
        <Card className="min-h-[180px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Seçilen Takım
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2 pb-8">
            {isRolling ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-muted-foreground text-sm">Çekilyor...</span>
              </div>
            ) : currentTeam ? (
              <p className="text-4xl font-bold text-center leading-tight">{currentTeam.name}</p>
            ) : (
              <p className="text-muted-foreground text-center text-sm">
                {isLoadingTeams ? "Yükleniyor..." : "Takım seçmek için çekiliş yap"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Roll counter */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: MAX_ROLLS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-10 rounded-full transition-colors ${
                i < rollCount ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground -mt-4">
          {rollCount >= MAX_ROLLS
            ? "Tüm hakkın bitti — takımını kilitle"
            : `${rollsLeft} çekiliş hakkın kaldı`}
        </p>

        {/* Available teams count */}
        {!isLoadingTeams && (
          <p className="text-center text-xs text-muted-foreground -mt-4">
            {availableTeams.length} takım mevcut
          </p>
        )}

        {/* Error */}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleRoll}
            disabled={!canRoll || isRolling}
            variant={isForcedLockIn ? "secondary" : "default"}
            className="w-full"
          >
            {rollCount === 0 ? "Çekiliş Yap" : "Tekrar Çek"}
          </Button>

          <Button
            onClick={handleLockIn}
            disabled={!canLockIn}
            variant={isForcedLockIn ? "default" : "outline"}
            className="w-full"
          >
            {isLockingIn ? "Seçiliyor..." : "Seç"}
          </Button>
        </div>

        {isForcedLockIn && (
          <p className="text-center text-xs text-muted-foreground">
            Çekiliş hakkın doldu. Yukarıdaki takımı seçmen gerekiyor.
          </p>
        )}
      </div>
    </div>
  );
}
