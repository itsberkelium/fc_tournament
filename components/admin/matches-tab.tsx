"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayoffsTab } from "@/components/admin/playoffs-tab";
import { useAdminStore } from "@/lib/stores/admin-store";
import { adminApi } from "@/lib/api";

type Match = {
  id: string;
  round: number;
  isCompleted: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homePlayer: { playerName: string; teamName: string; isDisqualified: boolean };
  awayPlayer: { playerName: string; teamName: string; isDisqualified: boolean };
};

export function MatchesTab() {
  const { password, tournamentStarted } = useAdminStore();
  const [view, setView] = useState<"league" | "playoff">("league");
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [resettingMatchId, setResettingMatchId] = useState<string | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);

  useEffect(() => {
    if (!password || !tournamentStarted) { setIsLoading(false); return; }
    adminApi.getMatches(password)
      .then(({ matches }) => setMatches(matches ?? []))
      .finally(() => setIsLoading(false));
  }, [password, tournamentStarted]);

  async function handleResetMatch(matchId: string) {
    setResettingMatchId(matchId);
    try {
      const res = await adminApi.resetMatch(matchId, password);
      if (!res.ok) return;
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, homeScore: null, awayScore: null, isCompleted: false } : m
        )
      );
      setScoreInputs((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    } finally {
      setResettingMatchId(null);
    }
  }

  async function handleSaveScore(matchId: string) {
    const input = scoreInputs[matchId];
    if (!input) return;
    setSavingMatchId(matchId);
    try {
      await adminApi.saveMatchScore(matchId, { homeScore: Number(input.home), awayScore: Number(input.away) }, password);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, homeScore: Number(input.home), awayScore: Number(input.away), isCompleted: true }
            : m
        )
      );
      setScoreInputs((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    } finally {
      setSavingMatchId(null);
    }
  }

  const toggle = (
    <div className="flex gap-1 w-fit rounded-md border border-border p-1">
      <Button size="sm" variant={view === "league" ? "default" : "ghost"} className="h-7 px-3 text-xs" onClick={() => setView("league")}>Lig</Button>
      <Button size="sm" variant={view === "playoff" ? "default" : "ghost"} className="h-7 px-3 text-xs" onClick={() => setView("playoff")}>Playoff</Button>
    </div>
  );

  if (view === "playoff") {
    return (
      <div className="space-y-4">
        {toggle}
        <PlayoffsTab />
      </div>
    );
  }

  if (!tournamentStarted) {
    return (
      <div className="space-y-4">
        {toggle}
        <p className="text-sm text-muted-foreground py-8 text-center">
          Maçları görmek için önce turnuvayı başlat.
        </p>
      </div>
    );
  }

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Yükleniyor...</div>;

  const matchdays = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {toggle}
      {matchdays.map((day) => {
        const dayMatches = matches.filter((m) => m.round === day);
        const allDone = dayMatches.every((m) => m.isCompleted);
        return (
          <div key={day} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{day}. Maç Günü</h3>
              {allDone && <Badge variant="secondary" className="text-xs">Tamamlandı</Badge>}
            </div>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ev Sahibi</TableHead>
                    <TableHead>Deplasman</TableHead>
                    <TableHead className="text-center">Skor</TableHead>
                    <TableHead className="w-[160px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayMatches.map((match) => {
                    const input = scoreInputs[match.id];
                    const isSaving = savingMatchId === match.id;
                    const hasDisqualified = match.homePlayer.isDisqualified || match.awayPlayer.isDisqualified;
                    return (
                      <TableRow key={match.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{match.homePlayer.playerName}</span>
                            {match.homePlayer.isDisqualified && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">DSK</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{match.homePlayer.teamName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{match.awayPlayer.playerName}</span>
                            {match.awayPlayer.isDisqualified && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">DSK</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{match.awayPlayer.teamName}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          {(match.isCompleted && input === undefined) || hasDisqualified ? (
                            <span className="font-bold tabular-nums">{match.homeScore} – {match.awayScore}</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="text" inputMode="numeric" pattern="[0-9]*"
                                className="w-14 text-center" placeholder="0"
                                value={input?.home ?? (match.homeScore?.toString() ?? "")}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  setScoreInputs((prev) => ({ ...prev, [match.id]: { home: val, away: prev[match.id]?.away ?? match.awayScore?.toString() ?? "" } }));
                                }}
                              />
                              <span className="text-muted-foreground">–</span>
                              <Input
                                type="text" inputMode="numeric" pattern="[0-9]*"
                                className="w-14 text-center" placeholder="0"
                                value={input?.away ?? (match.awayScore?.toString() ?? "")}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  setScoreInputs((prev) => ({ ...prev, [match.id]: { away: val, home: prev[match.id]?.home ?? match.homeScore?.toString() ?? "" } }));
                                }}
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            {hasDisqualified ? null : match.isCompleted && input === undefined ? (
                              <>
                                <Button variant="outline" size="sm"
                                  onClick={() => setScoreInputs((prev) => ({ ...prev, [match.id]: { home: match.homeScore?.toString() ?? "", away: match.awayScore?.toString() ?? "" } }))}>
                                  Düzenle
                                </Button>
                                {confirmResetId === match.id ? (
                                  <>
                                    <Button
                                      variant="destructive" size="sm"
                                      disabled={resettingMatchId === match.id}
                                      onClick={() => { setConfirmResetId(null); handleResetMatch(match.id); }}
                                    >
                                      {resettingMatchId === match.id ? "..." : "Evet, Sıfırla"}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setConfirmResetId(null)}>
                                      İptal
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline" size="sm"
                                    className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setConfirmResetId(match.id)}
                                  >
                                    Sıfırla
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button size="sm" disabled={isSaving || !input?.home || !input?.away} onClick={() => handleSaveScore(match.id)}>
                                {isSaving ? "Kaydediliyor..." : "Kaydet"}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
