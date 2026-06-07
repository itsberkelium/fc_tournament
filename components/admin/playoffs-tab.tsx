"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

type PlayoffData = {
  enabled: boolean;
  teamCount: number;
  leagueComplete: boolean;
  playoffStarted: boolean;
  standings: { playerId: string; playerName: string; teamId: string; teamName: string }[];
  bracket: { totalRounds: number; rounds: BracketRound[] };
};

type PlayoffsTabProps = { password: string };

export function PlayoffsTab({ password }: PlayoffsTabProps) {
  const [data, setData] = useState<PlayoffData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${password}` }),
    [password]
  );

  const load = useCallback(() => {
    fetch("/api/playoffs")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { if (password) load(); }, [password, load]);

  async function handleStart() {
    setIsStarting(true);
    setError(null);
    const res = await fetch("/api/admin/tournament/playoffs/start", { method: "POST", headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) setError(json.message);
    else load();
    setIsStarting(false);
  }

  async function handleSave(matchId: string) {
    const input = scoreInputs[matchId];
    if (!input?.home || !input?.away) return;
    setSavingId(matchId);
    const res = await fetch(`/api/admin/matches/${matchId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ homeScore: input.home, awayScore: input.away }),
    });
    if (res.ok) {
      setScoreInputs((prev) => { const next = { ...prev }; delete next[matchId]; return next; });
      load();
    }
    setSavingId(null);
  }

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Yükleniyor...</div>;
  if (!data?.enabled) return <div className="py-8 text-center text-sm text-muted-foreground">Bu turnuvada playoff ayarlanmamış.</div>;

  const { leagueComplete, playoffStarted, bracket } = data;

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
        {!playoffStarted && (
          <Button onClick={handleStart} disabled={!leagueComplete || isStarting}>
            {isStarting ? "Başlatılıyor..." : "Playoff Başlat"}
          </Button>
        )}
        {playoffStarted && <Badge variant="default">Playoff Aktif</Badge>}
      </div>

      {bracket.rounds.map(({ round, label, matches }) => (
        <div key={round} className="space-y-3">
          <h3 className="text-sm font-semibold">{label}</h3>
          <div className="space-y-2">
            {matches.map((match) => {
              const input = scoreInputs[match.id ?? ""];
              const isSaving = savingId === match.id;
              const isEditing = match.id !== null && input !== undefined;

              return (
                <div key={`${round}-${match.slot}`} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Home */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <div className="text-right min-w-0">
                        {match.homePlayer ? (
                          <>
                            <p className="text-sm font-medium truncate">{match.homePlayer.teamName}</p>
                            <p className="text-xs text-muted-foreground truncate">{match.homePlayer.playerName}</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            {match.isPlaceholder ? `${match.slot + 1}. Sıra` : "TBD"}
                          </p>
                        )}
                      </div>
                      {match.homePlayer && (
                        <Flag teamId={match.homePlayer.teamId} teamName={match.homePlayer.teamName} />
                      )}
                    </div>

                    {/* Score */}
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
                        <span className="text-xs text-muted-foreground">
                          {match.isPlaceholder ? (match.leagueNotDone ? "Tahmini" : "vs") : "vs"}
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
                            <p className="text-sm font-medium truncate">{match.awayPlayer.teamName}</p>
                            <p className="text-xs text-muted-foreground truncate">{match.awayPlayer.playerName}</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            {match.isPlaceholder ? `${data.teamCount - match.slot}. Sıra` : "TBD"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin score controls */}
                  {match.id && (
                    <div className="flex justify-center gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" disabled={isSaving || !input.home || !input.away} onClick={() => handleSave(match.id!)}>
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

                  {/* Winner badge */}
                  {match.isCompleted && match.winnerId && (
                    <div className="text-center">
                      <Badge variant="default" className="text-xs">
                        Galip: {match.winnerId === match.homePlayer?.id ? match.homePlayer?.playerName : match.awayPlayer?.playerName}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
