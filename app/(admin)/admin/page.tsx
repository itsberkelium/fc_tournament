"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { getAdminSession, getAdminPassword, clearAdminSession } from "@/lib/admin-auth";
import teams from "@/lib/teams.json";
import type { Team } from "@/types/Team";

const ALL_TEAMS = teams as Team[];

type Player = {
  id: string;
  playerName: string;
  teamName: string;
  createdAt: string;
};

type Match = {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  isCompleted: boolean;
  round: number;
  homePlayer: { playerName: string; teamName: string };
  awayPlayer: { playerName: string; teamName: string };
};

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [claimedTeamIds, setClaimedTeamIds] = useState<string[]>([]);
  const [disabledTeamIds, setDisabledTeamIds] = useState<string[]>([]);
  const [togglingTeamId, setTogglingTeamId] = useState<string | null>(null);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerSort, setPlayerSort] = useState<"name" | "team" | "date">("date");
  const [playerSortDir, setPlayerSortDir] = useState<"asc" | "desc">("asc");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSort, setTeamSort] = useState<"name" | "rating" | "status">("name");
  const [teamSortDir, setTeamSortDir] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [playoffEnabled, setPlayoffEnabled] = useState(false);
  const [playoffTeamCount, setPlayoffTeamCount] = useState<number>(4);
  const [doubleLegs, setDoubleLegs] = useState(false);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setPassword(getAdminPassword());
  }, [router]);

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${password}` }),
    [password]
  );

  const loadData = useCallback(async () => {
    if (!password) return;
    setIsLoading(true);
    try {
      const [playersRes, statusRes, claimedRes] = await Promise.all([
        fetch("/api/admin/players", { headers: authHeaders() }),
        fetch("/api/admin/tournament/status"),
        fetch("/api/players/claimed-teams"),
      ]);
      const { players } = await playersRes.json();
      const { started } = await statusRes.json();
      const { claimedTeamIds, disabledTeamIds } = await claimedRes.json();

      setPlayers(players ?? []);
      setTournamentStarted(started);
      setClaimedTeamIds(claimedTeamIds ?? []);
      setDisabledTeamIds(disabledTeamIds ?? []);

      if (started) {
        const matchesRes = await fetch("/api/admin/matches", { headers: authHeaders() });
        const { matches } = await matchesRes.json();
        setMatches(matches ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [password, authHeaders]);

  useEffect(() => {
    if (password) loadData();
  }, [password, loadData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/admin/players/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setPlayers((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleStartTournament() {
    setShowStartDialog(false);
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tournament/start", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ playoffEnabled, playoffTeamCount: playoffEnabled ? playoffTeamCount : 0, doubleLegs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        await loadData();
      }
    } finally {
      setIsStarting(false);
    }
  }

  async function handleToggleTeam(teamId: string) {
    setTogglingTeamId(teamId);
    const isDisabled = disabledTeamIds.includes(teamId);
    try {
      await fetch(`/api/admin/teams/${teamId}`, {
        method: isDisabled ? "DELETE" : "POST",
        headers: authHeaders(),
      });
      setDisabledTeamIds((prev) =>
        isDisabled ? prev.filter((id) => id !== teamId) : [...prev, teamId]
      );
    } finally {
      setTogglingTeamId(null);
    }
  }

  async function handleSaveScore(matchId: string) {
    const input = scoreInputs[matchId];
    if (!input) return;
    setSavingMatchId(matchId);
    try {
      await fetch(`/api/admin/matches/${matchId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ homeScore: input.home, awayScore: input.away }),
      });
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

  function handleLogout() {
    clearAdminSession();
    router.replace("/admin/login");
  }

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.toLowerCase();
    const filtered = players.filter((p) => p.playerName.toLowerCase().includes(q));
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (playerSort === "name") cmp = a.playerName.localeCompare(b.playerName);
      else if (playerSort === "team") cmp = a.teamName.localeCompare(b.teamName);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return playerSortDir === "asc" ? cmp : -cmp;
    });
  }, [players, playerSearch, playerSort, playerSortDir]);

  const filteredTeams = useMemo(() => {
    const q = teamSearch.toLowerCase();
    const unclaimed = ALL_TEAMS.filter((t) => !claimedTeamIds.includes(t.id));
    const filtered = unclaimed.filter((t) => t.name.toLowerCase().includes(q));
    return [...filtered].sort((a, b) => {
      const aDisabled = disabledTeamIds.includes(a.id);
      const bDisabled = disabledTeamIds.includes(b.id);
      let cmp = 0;
      if (teamSort === "name") cmp = a.name.localeCompare(b.name);
      else if (teamSort === "rating") cmp = a.rating - b.rating;
      else cmp = Number(aDisabled) - Number(bDisabled);
      return teamSortDir === "asc" ? cmp : -cmp;
    });
  }, [claimedTeamIds, disabledTeamIds, teamSearch, teamSort, teamSortDir]);

  function SortButton({ label, field, current, dir, onSort }: {
    label: string;
    field: string;
    current: string;
    dir: "asc" | "desc";
    onSort: (f: string) => void;
  }) {
    const active = current === field;
    return (
      <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 hover:text-foreground transition-colors ${active ? "text-foreground font-semibold" : "text-muted-foreground"}`}
      >
        {label}
        <span className="text-xs">{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-bold">Yönetici Paneli</h1>
          <p className="text-xs text-muted-foreground">EA FC 26 Ligi</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Çıkış
        </Button>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="players">
          <TabsList>
            <TabsTrigger value="players">
              Oyuncular
              <Badge variant="secondary" className="ml-2 text-xs">{players.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="teams">
              Takımlar
              {disabledTeamIds.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">{disabledTeamIds.length} devre dışı</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="matches">Maçlar</TabsTrigger>
          </TabsList>

          {/* Players tab */}
          <TabsContent value="players" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tournamentStarted ? "Turnuva başladı — oyuncu kaydı kapalı." : `${players.length} oyuncu kayıtlı.`}
              </p>
              {!tournamentStarted && (
                <Button onClick={() => setShowStartDialog(true)} disabled={isStarting || players.length < 2}>
                  {isStarting ? "Başlatılıyor..." : "Turnuvayı Başlat"}
                </Button>
              )}
              {tournamentStarted && <Badge variant="default">Turnuva Aktif</Badge>}
            </div>

            <Input
              placeholder="Oyuncu adı ara..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="max-w-xs"
            />

            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton label="Oyuncu" field="name" current={playerSort} dir={playerSortDir}
                        onSort={(f) => { if (playerSort === f) setPlayerSortDir((d) => d === "asc" ? "desc" : "asc"); else { setPlayerSort(f as typeof playerSort); setPlayerSortDir("asc"); } }} />
                    </TableHead>
                    <TableHead>
                      <SortButton label="Takım" field="team" current={playerSort} dir={playerSortDir}
                        onSort={(f) => { if (playerSort === f) setPlayerSortDir((d) => d === "asc" ? "desc" : "asc"); else { setPlayerSort(f as typeof playerSort); setPlayerSortDir("asc"); } }} />
                    </TableHead>
                    <TableHead>
                      <SortButton label="Kayıt Tarihi" field="date" current={playerSort} dir={playerSortDir}
                        onSort={(f) => { if (playerSort === f) setPlayerSortDir((d) => d === "asc" ? "desc" : "asc"); else { setPlayerSort(f as typeof playerSort); setPlayerSortDir("asc"); } }} />
                    </TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        {playerSearch ? "Sonuç bulunamadı." : "Henüz kayıtlı oyuncu yok."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.playerName}</TableCell>
                        <TableCell>{player.teamName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(player.createdAt).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          <Button variant="destructive" size="sm" disabled={tournamentStarted} onClick={() => setDeleteTarget(player)}>
                            Sil
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Teams tab */}
          <TabsContent value="teams" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Kuraya kapalı takımlar havuzdan çıkarılır. Seçilmiş takımlar burada gösterilmez.
            </p>

            <Input
              placeholder="Takım adı ara..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="max-w-xs"
            />

            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton label="Takım" field="name" current={teamSort} dir={teamSortDir}
                        onSort={(f) => { if (teamSort === f) setTeamSortDir((d) => d === "asc" ? "desc" : "asc"); else { setTeamSort(f as typeof teamSort); setTeamSortDir("asc"); } }} />
                    </TableHead>
                    <TableHead className="text-center">
                      <SortButton label="OVR" field="rating" current={teamSort} dir={teamSortDir}
                        onSort={(f) => { if (teamSort === f) setTeamSortDir((d) => d === "asc" ? "desc" : "asc"); else { setTeamSort(f as typeof teamSort); setTeamSortDir("asc"); } }} />
                    </TableHead>
                    <TableHead className="text-center">
                      <SortButton label="Durum" field="status" current={teamSort} dir={teamSortDir}
                        onSort={(f) => { if (teamSort === f) setTeamSortDir((d) => d === "asc" ? "desc" : "asc"); else { setTeamSort(f as typeof teamSort); setTeamSortDir("asc"); } }} />
                    </TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        {teamSearch ? "Sonuç bulunamadı." : "Gösterilecek takım yok."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeams.map((team) => {
                      const isDisabled = disabledTeamIds.includes(team.id);
                      const isToggling = togglingTeamId === team.id;
                      return (
                        <TableRow key={team.id} className={isDisabled ? "opacity-50" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Image
                                src={`https://flagcdn.com/w40/${team.flag}.png`}
                                alt={team.name}
                                width={28}
                                height={19}
                                className="rounded-sm"
                                unoptimized
                              />
                              <span className="font-medium">{team.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center tabular-nums font-semibold">{team.rating}</TableCell>
                          <TableCell className="text-center">
                            {isDisabled ? <Badge variant="destructive">Devre Dışı</Badge> : <Badge variant="secondary">Aktif</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={isDisabled ? "outline" : "destructive"}
                              disabled={isToggling}
                              onClick={() => handleToggleTeam(team.id)}
                            >
                              {isToggling ? "..." : isDisabled ? "Etkinleştir" : "Devre Dışı"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Matches tab */}
          <TabsContent value="matches" className="space-y-6">
            {!tournamentStarted ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Maçları görmek için önce turnuvayı başlat.
              </p>
            ) : (() => {
              const matchdays = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);
              return matchdays.map((day) => {
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
                            return (
                              <TableRow key={match.id}>
                                <TableCell>
                                  <div className="font-medium">{match.homePlayer.playerName}</div>
                                  <div className="text-xs text-muted-foreground">{match.homePlayer.teamName}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{match.awayPlayer.playerName}</div>
                                  <div className="text-xs text-muted-foreground">{match.awayPlayer.teamName}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {match.isCompleted && input === undefined ? (
                                    <span className="font-bold tabular-nums">
                                      {match.homeScore} – {match.awayScore}
                                    </span>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <Input
                                        type="number"
                                        min={0}
                                        className="w-14 text-center"
                                        placeholder="0"
                                        value={input?.home ?? (match.homeScore?.toString() ?? "")}
                                        onChange={(e) =>
                                          setScoreInputs((prev) => ({
                                            ...prev,
                                            [match.id]: { home: e.target.value, away: prev[match.id]?.away ?? match.awayScore?.toString() ?? "" },
                                          }))
                                        }
                                      />
                                      <span className="text-muted-foreground">–</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        className="w-14 text-center"
                                        placeholder="0"
                                        value={input?.away ?? (match.awayScore?.toString() ?? "")}
                                        onChange={(e) =>
                                          setScoreInputs((prev) => ({
                                            ...prev,
                                            [match.id]: { away: e.target.value, home: prev[match.id]?.home ?? match.homeScore?.toString() ?? "" },
                                          }))
                                        }
                                      />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2 justify-end">
                                    {match.isCompleted && input === undefined ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setScoreInputs((prev) => ({
                                            ...prev,
                                            [match.id]: {
                                              home: match.homeScore?.toString() ?? "",
                                              away: match.awayScore?.toString() ?? "",
                                            },
                                          }))
                                        }
                                      >
                                        Düzenle
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        disabled={isSaving || !input?.home || !input?.away}
                                        onClick={() => handleSaveScore(match.id)}
                                      >
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
              });
            })()}
          </TabsContent>
        </Tabs>
      </main>

      {/* Tournament start confirmation dialog */}
      <Dialog open={showStartDialog} onOpenChange={(open) => !open && setShowStartDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Turnuvayı Başlat</DialogTitle>
            <DialogDescription>
              {players.length} oyuncu için lig maçları oluşturulacak. Başlamadan önce play-off ayarlarını belirle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Çift maç (iç saha + deplasman)?</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={doubleLegs ? "default" : "outline"}
                  onClick={() => setDoubleLegs(true)}
                  className="flex-1"
                >
                  Evet
                </Button>
                <Button
                  size="sm"
                  variant={!doubleLegs ? "default" : "outline"}
                  onClick={() => setDoubleLegs(false)}
                  className="flex-1"
                >
                  Hayır
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Play-off olacak mı?</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={playoffEnabled ? "default" : "outline"}
                  onClick={() => setPlayoffEnabled(true)}
                  className="flex-1"
                >
                  Evet
                </Button>
                <Button
                  size="sm"
                  variant={!playoffEnabled ? "default" : "outline"}
                  onClick={() => setPlayoffEnabled(false)}
                  className="flex-1"
                >
                  Hayır
                </Button>
              </div>
            </div>

            {playoffEnabled && (
              <div className="space-y-2">
                <Label>Kaç takım play-off&apos;a katılacak?</Label>
                <div className="flex gap-2 flex-wrap">
                  {[2, 4, 8].filter((n) => n <= players.length).map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant={playoffTeamCount === n ? "default" : "outline"}
                      onClick={() => setPlayoffTeamCount(n)}
                    >
                      İlk {n}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>


          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)} disabled={isStarting}>
              İptal
            </Button>
            <Button onClick={handleStartTournament} disabled={isStarting}>
              Başlat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oyuncuyu Sil</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.playerName}</strong> adlı oyuncu ve takım seçimi ({deleteTarget?.teamName}) silinecek.
              Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
