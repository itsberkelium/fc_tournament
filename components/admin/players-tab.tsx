"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeletePlayerDialog, type Player } from "@/components/admin/delete-player-dialog";
import { EditPlayerDialog } from "@/components/admin/edit-player-dialog";
import { StartTournamentDialog } from "@/components/admin/start-tournament-dialog";
import { useAdminStore } from "@/lib/stores/admin-store";
import { adminApi } from "@/lib/api";

type SortField = "name" | "team" | "date";

function SortButton({ label, field, current, dir, onSort }: {
  label: string; field: string; current: string; dir: "asc" | "desc"; onSort: (f: string) => void;
}) {
  const active = current === field;
  return (
    <button onClick={() => onSort(field)} className={`flex items-center gap-1 hover:text-foreground transition-colors ${active ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
      {label}
      <span className="text-xs">{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
    </button>
  );
}

export function PlayersTab() {
  const { password, tournamentStarted, setTournamentStarted, setPlayerCount } = useAdminStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerSort, setPlayerSort] = useState<SortField>("date");
  const [playerSortDir, setPlayerSortDir] = useState<"asc" | "desc">("asc");
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Player | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!password) return;
    adminApi.getPlayers(password)
      .then(({ players }) => {
        const list = players ?? [];
        setPlayers(list);
        setPlayerCount(list.length);
      })
      .finally(() => setIsLoading(false));
  }, [password, setPlayerCount]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminApi.deletePlayer(deleteTarget.id, password);
      setPlayers((prev) => {
        const next = prev.filter((p) => p.id !== deleteTarget.id);
        setPlayerCount(next.length);
        return next;
      });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleStartTournament(options: { doubleLegs: boolean; playoffEnabled: boolean; playoffTeamCount: number }) {
    setIsStarting(true);
    setError(null);
    setShowStartDialog(false);
    try {
      const res = await adminApi.startTournament(options, password);
      const data = await res.json();
      if (!res.ok) setError(data.message);
      else setTournamentStarted(true);
    } finally {
      setIsStarting(false);
    }
  }

  function handleSort(field: string) {
    if (playerSort === field) setPlayerSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setPlayerSort(field as SortField); setPlayerSortDir("asc"); }
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

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Yükleniyor...</div>;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

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

      <Input placeholder="Oyuncu adı ara..." value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)} className="max-w-xs" />

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortButton label="Oyuncu" field="name" current={playerSort} dir={playerSortDir} onSort={handleSort} /></TableHead>
              <TableHead><SortButton label="Takım" field="team" current={playerSort} dir={playerSortDir} onSort={handleSort} /></TableHead>
              <TableHead><SortButton label="Kayıt Tarihi" field="date" current={playerSort} dir={playerSortDir} onSort={handleSort} /></TableHead>
              <TableHead className="w-[140px]" />
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
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.playerName}</span>
                      {player.isDisqualified && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Diskalifiye</Badge>
                      )}
                      {!player.isDisqualified && player.isDisabled && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Devre Dışı</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{player.teamName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(player.createdAt).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => setEditTarget(player)}>Düzenle</Button>
                      <Button variant="destructive" size="sm" disabled={tournamentStarted} onClick={() => setDeleteTarget(player)}>Sil</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditPlayerDialog
        player={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={(updated) => setPlayers((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p))}
      />
      <StartTournamentDialog
        isOpen={showStartDialog}
        playerCount={players.length}
        isStarting={isStarting}
        onClose={() => setShowStartDialog(false)}
        onConfirm={handleStartTournament}
      />
      <DeletePlayerDialog
        target={deleteTarget}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
