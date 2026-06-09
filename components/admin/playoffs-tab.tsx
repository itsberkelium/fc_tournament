"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Flag } from "@/components/flag";
import { useAdminStore } from "@/lib/stores/admin-store";
import { adminApi, publicApi } from "@/lib/api";
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

type PlayoffData = {
  enabled: boolean;
  teamCount: number;
  leagueComplete: boolean;
  playoffStarted: boolean;
  standings: { playerId: string; playerName: string; teamId: string; teamName: string }[];
  bracket: {
    totalRounds: number;
    rounds: BracketRound[];
    thirdPlaceMatch: BracketMatch | null;
  };
};

export function PlayoffsTab({ isAdmin = false }: { isAdmin?: boolean }) {
  const { password } = useAdminStore();
  const [data, setData] = useState<PlayoffData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(() => {
    publicApi.getPlayoffs().then(setData).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { if (password) load(); }, [password, load]);

  async function handleStart() {
    setIsStarting(true);
    setError(null);
    const res = await adminApi.startPlayoffs(password);
    const json = await res.json();
    if (!res.ok) setError(json.message);
    else load();
    setIsStarting(false);
  }

  async function handleSave(matchId: string) {
    const input = scoreInputs[matchId];
    if (!input?.home || !input?.away) return;
    setSavingId(matchId);
    const res = await adminApi.saveMatchScore(matchId, { homeScore: Number(input.home), awayScore: Number(input.away) }, password);
    if (res.ok) {
      setScoreInputs((prev) => { const next = { ...prev }; delete next[matchId]; return next; });
      load();
    }
    setSavingId(null);
  }

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Yükleniyor...</div>;
  if (!data?.enabled) return <div className="py-8 text-center text-sm text-muted-foreground">Bu turnuvada playoff ayarlanmamış.</div>;

  const { leagueComplete, playoffStarted, bracket } = data;

  function renderMatchCard(match: BracketMatch, round: number, keyStr: string, isThirdPlace = false) {
    const input = scoreInputs[match.id ?? ""];
    const isSaving = savingId === match.id;
    const isEditing = match.id !== null && input !== undefined;

    const homePlaceholderText = isThirdPlace
      ? getThirdPlaceFeederLabel(bracket.totalRounds, "home")
      : round === 1
        ? `${match.slot + 1}. Sıra`
        : getFeederLabel(round, bracket.totalRounds, match.slot, "home");

    const awayPlaceholderText = isThirdPlace
      ? getThirdPlaceFeederLabel(bracket.totalRounds, "away")
      : round === 1
        ? `${data!.teamCount - match.slot}. Sıra`
        : getFeederLabel(round, bracket.totalRounds, match.slot, "away");

    return (
      <div key={keyStr} className="rounded-md border border-border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            <div className="text-right min-w-0">
              {match.homePlayer ? (
                <>
                  <p className="text-sm font-medium truncate">{match.homePlayer.teamName}</p>
                  <p className="text-xs text-muted-foreground truncate">{match.homePlayer.playerName}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">{homePlaceholderText}</p>
              )}
            </div>
            {match.homePlayer && (
              <Flag teamId={match.homePlayer.teamId} teamName={match.homePlayer.teamName} />
            )}
          </div>

          <div className="shrink-0 w-24 text-center">
            {isEditing ? (
              <div className="flex items-center gap-1 justify-center">
                <Input type="text" inputMode="numeric" pattern="[0-9]*" className="w-10 text-center px-1" placeholder="0" value={input.home}
                  onChange={(e) => setScoreInputs((p) => ({ ...p, [match.id!]: { ...p[match.id!], home: e.target.value.replace(/\D/g, "") } }))} />
                <span className="text-muted-foreground">–</span>
                <Input type="text" inputMode="numeric" pattern="[0-9]*" className="w-10 text-center px-1" placeholder="0" value={input.away}
                  onChange={(e) => setScoreInputs((p) => ({ ...p, [match.id!]: { ...p[match.id!], away: e.target.value.replace(/\D/g, "") } }))} />
              </div>
            ) : match.isCompleted ? (
              <span className="text-sm font-bold tabular-nums">{match.homeScore} – {match.awayScore}</span>
            ) : (
              <span className="text-xs text-muted-foreground">vs</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
            {match.awayPlayer && (
              <Flag teamId={match.awayPlayer.teamId} teamName={match.awayPlayer.teamName} />
            )}
            <div className="min-w-0">
              {match.awayPlayer ? (
                <>
                  <p className="text-sm font-medium truncate">{match.awayPlayer.teamName}</p>
                  <p className="text-xs text-muted-foreground truncate">{match.awayPlayer.playerName}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">{awayPlaceholderText}</p>
              )}
            </div>
          </div>
        </div>

        {match.id && (
          <div className="flex justify-center gap-2">
            {isEditing ? (
              <>
                <Button size="sm" disabled={isSaving || !input.home || !input.away || input.home === input.away} onClick={() => handleSave(match.id!)}>
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
                <Button size="sm" variant="outline" disabled={isSaving}
                  onClick={() => setScoreInputs((p) => { const n = { ...p }; delete n[match.id!]; return n; })}>
                  İptal
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline"
                onClick={() => setScoreInputs((p) => ({ ...p, [match.id!]: { home: match.homeScore?.toString() ?? "", away: match.awayScore?.toString() ?? "" } }))}>
                {match.isCompleted ? "Düzenle" : "Skor Gir"}
              </Button>
            )}
          </div>
        )}

        {match.isCompleted && match.winnerId && (
          <div className="text-center">
            <Badge variant={isThirdPlace ? "secondary" : "default"} className="text-xs">
              {isThirdPlace ? "3. Takım: " : "Galip: "}{match.winnerId === match.homePlayer?.id ? match.homePlayer?.playerName : match.awayPlayer?.playerName}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {!leagueComplete
            ? "Lig tamamlanmadı — playoff başlatılamaz."
            : playoffStarted
            ? "Playoff aktif."
            : "Lig tamamlandı — playoff başlatılabilir."}
        </p>
        {isAdmin && !playoffStarted && (
          <Button onClick={handleStart} disabled={!leagueComplete || isStarting}>
            {isStarting ? "Başlatılıyor..." : "Playoff Başlat"}
          </Button>
        )}
        {playoffStarted && <Badge variant="default">Playoff Aktif</Badge>}
      </div>

      {bracket.rounds.map(({ round, label, matches }) => (
        <div key={round}>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{label}</h3>
            <div className="space-y-2">
              {matches.map((match) => renderMatchCard(match, round, `${round}-${match.slot}`))}
            </div>
          </div>

          {round === bracket.totalRounds - 1 && bracket.thirdPlaceMatch && (
            <div className="space-y-3 mt-6">
              <h3 className="text-sm font-semibold">3. Yer Maçı</h3>
              <div className="space-y-2">
                {renderMatchCard(bracket.thirdPlaceMatch, bracket.totalRounds, "third-place", true)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
