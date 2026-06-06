"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getStoredPlayer, clearStoredPlayer } from "@/lib/player-storage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import teams from "@/lib/teams.json";
import type { Team } from "@/types/Team";

type PlayerInfo = {
  playerName: string;
  teamName: string;
  teamId: string;
};

type StandingRow = {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

const ALL_TEAMS = teams as Team[];

function Flag({ teamId, teamName, size = 40 }: { teamId: string; teamName: string; size?: number }) {
  const team = ALL_TEAMS.find((t) => t.id === teamId);
  if (!team) return null;
  return (
    <Image
      src={`https://flagcdn.com/w80/${team.flag}.png`}
      alt={teamName}
      width={size}
      height={Math.round(size * 0.67)}
      className="rounded shadow-sm shrink-0"
      unoptimized
    />
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [tournamentName, setTournamentName] = useState("EA FC 26 Ligi");

  const fetchLeaderboard = useCallback(async () => {
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    setStandings(data.standings ?? []);
  }, []);

  useEffect(() => {
    const stored = getStoredPlayer();
    if (!stored) {
      router.replace("/login");
      return;
    }

    Promise.all([
      fetch(`/api/players/me?playerName=${encodeURIComponent(stored.playerName)}`).then((r) => r.json()),
      fetch("/api/admin/tournament/status").then((r) => r.json()),
      fetch("/api/leaderboard").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([playerData, statusData, leaderboardData, settingsData]) => {
        if (!playerData.exists || !playerData.hasTeam) {
          clearStoredPlayer();
          router.replace("/login");
          return;
        }
        setPlayer({
          playerName: playerData.player.playerName,
          teamName: playerData.player.teamName,
          teamId: playerData.player.teamId,
        });
        setTournamentStarted(statusData.started ?? false);
        setStandings(leaderboardData.standings ?? []);
        setTournamentName(settingsData.settings?.tournamentName ?? "EA FC 26 Ligi");
      })
      .catch(() => {
        clearStoredPlayer();
        router.replace("/login");
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  useEffect(() => {
    if (!tournamentStarted) return;
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [tournamentStarted, fetchLeaderboard]);

  const teamFlag = player ? ALL_TEAMS.find((t) => t.id === player.teamId)?.flag : null;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-bold tracking-tight">{tournamentName}</h1>

        {player && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{player.playerName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{player.teamName}</p>
            </div>
            {teamFlag ? (
              <Image
                src={`https://flagcdn.com/w80/${teamFlag}.png`}
                alt={player.teamName}
                width={40}
                height={27}
                className="rounded shadow-sm"
                unoptimized
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {player.playerName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Nav */}
      <nav className="flex gap-1 border-b border-border px-6">
        <Link
          href="/dashboard"
          className="px-3 py-2.5 text-sm font-medium border-b-2 border-primary text-foreground"
        >
          Puan Tablosu
        </Link>
        <Link
          href="/fixtures"
          className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Fikstür
        </Link>
      </nav>

      <main className="flex flex-1 flex-col p-6 max-w-4xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Lig Tablosu</h2>
          {!tournamentStarted && (
            <span className="text-xs text-muted-foreground">Turnuva henüz başlamadı</span>
          )}
        </div>

        {standings.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              {tournamentStarted ? "Henüz tamamlanan maç yok." : "Turnuva başladığında tablo burada görünecek."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>Takım / Oyuncu</TableHead>
                  <TableHead className="text-center w-10" title="Oynanan">O</TableHead>
                  <TableHead className="text-center w-10" title="Galibiyet">G</TableHead>
                  <TableHead className="text-center w-10" title="Beraberlik">B</TableHead>
                  <TableHead className="text-center w-10" title="Mağlubiyet">M</TableHead>
                  <TableHead className="text-center w-10" title="Atılan Gol">AG</TableHead>
                  <TableHead className="text-center w-10" title="Yenilen Gol">YG</TableHead>
                  <TableHead className="text-center w-12" title="Averaj">Av</TableHead>
                  <TableHead className="text-center w-10 font-bold" title="Puan">P</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((row, i) => {
                  const isCurrentPlayer = row.playerName === player?.playerName;
                  return (
                    <TableRow
                      key={row.playerId}
                      className={isCurrentPlayer ? "bg-primary/5 font-medium" : ""}
                    >
                      <TableCell className="text-center text-muted-foreground tabular-nums text-sm">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          <Flag teamId={row.teamId} teamName={row.teamName} size={32} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-none truncate">{row.teamName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{row.playerName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-sm">{row.played}</TableCell>
                      <TableCell className="text-center tabular-nums text-sm">{row.won}</TableCell>
                      <TableCell className="text-center tabular-nums text-sm">{row.drawn}</TableCell>
                      <TableCell className="text-center tabular-nums text-sm">{row.lost}</TableCell>
                      <TableCell className="text-center tabular-nums text-sm">{row.goalsFor}</TableCell>
                      <TableCell className="text-center tabular-nums text-sm">{row.goalsAgainst}</TableCell>
                      <TableCell className={`text-center tabular-nums text-sm ${row.goalDiff > 0 ? "text-green-600 dark:text-green-400" : row.goalDiff < 0 ? "text-red-500" : ""}`}>
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-sm font-bold">{row.points}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
