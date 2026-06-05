"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAdminSession, getAdminPassword, clearAdminSession } from "@/lib/admin-auth";

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
  homePlayer: { playerName: string; teamName: string };
  awayPlayer: { playerName: string; teamName: string };
};

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
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
      const [playersRes, statusRes] = await Promise.all([
        fetch("/api/admin/players", { headers: authHeaders() }),
        fetch("/api/admin/tournament/status"),
      ]);
      const { players } = await playersRes.json();
      const { started } = await statusRes.json();
      setPlayers(players ?? []);
      setTournamentStarted(started);

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
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tournament/start", {
        method: "POST",
        headers: authHeaders(),
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
    sessionStorage.removeItem("fc26_admin_pw");
    router.replace("/admin/login");
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
      {/* Header */}
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
            <TabsTrigger value="matches">Maçlar</TabsTrigger>
          </TabsList>

          {/* Players tab */}
          <TabsContent value="players" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tournamentStarted
                  ? "Turnuva başladı — oyuncu kaydı kapalı."
                  : `${players.length} oyuncu kayıtlı.`}
              </p>
              {!tournamentStarted && (
                <Button
                  onClick={handleStartTournament}
                  disabled={isStarting || players.length < 2}
                >
                  {isStarting ? "Başlatılıyor..." : "Turnuvayı Başlat"}
                </Button>
              )}
              {tournamentStarted && (
                <Badge variant="default">Turnuva Aktif</Badge>
              )}
            </div>

            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oyuncu</TableHead>
                    <TableHead>Takım</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Henüz kayıtlı oyuncu yok.
                      </TableCell>
                    </TableRow>
                  ) : (
                    players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.playerName}</TableCell>
                        <TableCell>{player.teamName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(player.createdAt).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={tournamentStarted}
                            onClick={() => setDeleteTarget(player)}
                          >
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

          {/* Matches tab */}
          <TabsContent value="matches" className="space-y-4">
            {!tournamentStarted ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Maçları görmek için önce turnuvayı başlat.
              </p>
            ) : (
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
                    {matches.map((match) => {
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
            )}
          </TabsContent>
        </Tabs>
      </main>

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
