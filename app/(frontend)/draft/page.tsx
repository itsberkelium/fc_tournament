"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import StarRating from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [tournamentStarted, setTournamentStarted] = useState(false);

  useEffect(() => {
    const player = getStoredPlayer();
    if (player) setPlayerName(player.playerName);

    const draft = getDraftState();
    setRollCount(draft.rollCount);
    if (draft.currentTeamId) {
      const team = ALL_TEAMS.find((t) => t.id === draft.currentTeamId) ?? null;
      setCurrentTeam(team);
    }

    Promise.all([
      fetch("/api/players/claimed-teams").then((r) => r.json()),
      fetch("/api/admin/tournament/status").then((r) => r.json()),
    ])
      .then(([claimedData, statusData]) => {
        const claimed: string[] = claimedData.claimedTeamIds ?? [];
        const disabled: string[] = claimedData.disabledTeamIds ?? [];
        const seen: string[] = draft.seenTeamIds ?? [];
        const excluded = new Set([...claimed, ...disabled, ...seen]);
        setAvailableTeams(ALL_TEAMS.filter((t) => !excluded.has(t.id)));
        setTournamentStarted(statusData.started ?? false);
      })
      .catch(() => {})
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
      const draft = getDraftState();
      const newSeen = [...(draft.seenTeamIds ?? []), randomTeam.id];

      setCurrentTeam(randomTeam);
      setRollCount(newCount);
      setAvailableTeams((prev) => prev.filter((t) => t.id !== randomTeam.id));
      setDraftState({ rollCount: newCount, currentTeamId: randomTeam.id, seenTeamIds: newSeen });
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
        // Team was just taken — it's already in seenTeamIds so won't reappear; just refund the roll
        const draft = getDraftState();
        const refundedCount = Math.max(0, rollCount - 1);
        setRollCount(refundedCount);
        setCurrentTeam(null);
        setDraftState({ ...draft, rollCount: refundedCount, currentTeamId: null });
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

  if (tournamentStarted && !isLoadingTeams) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert>
            <AlertDescription className="text-center">
              Turnuva başladı. Artık takım seçimi yapılamaz.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
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
          <h1 className="text-3xl font-bold tracking-tight">Kura</h1>
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
              <div className="flex flex-col items-center gap-3 w-full py-2">
                {/* Flag */}
                <Image
                  src={`https://flagcdn.com/w160/${currentTeam.flag}.png`}
                  alt={currentTeam.name}
                  width={120}
                  height={80}
                  className="rounded shadow-md"
                  unoptimized
                />

                {/* Team name */}
                <p className="text-2xl font-bold text-center leading-tight">{currentTeam.name}</p>

                {/* Overall */}
                <p className="text-5xl font-black tabular-nums text-primary leading-none">
                  {currentTeam.rating}
                </p>

                {/* Stars */}
                <StarRating stars={currentTeam.stars} />

                {/* ATK MID DEF */}
                <div className="flex items-start justify-center gap-8 pt-1">
                  {[
                    { label: "ATK", value: currentTeam.attack },
                    { label: "MID", value: currentTeam.midfield },
                    { label: "DEF", value: currentTeam.defence },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <span className="text-2xl font-bold tabular-nums">{value}</span>
                      <span className="text-xs text-muted-foreground font-medium tracking-wide">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
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
            {rollCount === 0 ? "Kura Çek" : "Tekrar Çek"}
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
            Kura hakkın doldu. Yukarıdaki takımı seçmen gerekiyor.
          </p>
        )}
      </div>
    </div>
  );
}
