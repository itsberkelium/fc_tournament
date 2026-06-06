"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getStoredPlayer, clearStoredPlayer } from "@/lib/player-storage";
import teams from "@/lib/teams.json";
import type { Team } from "@/types/Team";

type PlayerInfo = {
  playerName: string;
  teamName: string;
  teamId: string;
};

type MatchPlayer = {
  id: string;
  playerName: string;
  teamId: string;
  teamName: string;
};

type Match = {
  id: string;
  round: number;
  isCompleted: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homePlayer: MatchPlayer;
  awayPlayer: MatchPlayer;
};

const ALL_TEAMS = teams as Team[];

function Flag({ teamId, teamName }: { teamId: string; teamName: string }) {
  const team = ALL_TEAMS.find((t) => t.id === teamId);
  if (!team) return null;
  return (
    <Image
      src={`https://flagcdn.com/w80/${team.flag}.png`}
      alt={teamName}
      width={28}
      height={19}
      className="rounded-sm shadow-sm shrink-0"
      unoptimized
    />
  );
}

export default function FixturesPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tournamentStarted, setTournamentStarted] = useState(false);

  useEffect(() => {
    const stored = getStoredPlayer();
    if (!stored) {
      router.replace("/login");
      return;
    }

    Promise.all([
      fetch(`/api/players/me?playerName=${encodeURIComponent(stored.playerName)}`).then((r) => r.json()),
      fetch("/api/admin/tournament/status").then((r) => r.json()),
      fetch("/api/fixtures").then((r) => r.json()),
    ])
      .then(([playerData, statusData, fixturesData]) => {
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
        setMatches(fixturesData.matches ?? []);
      })
      .catch(() => {
        clearStoredPlayer();
        router.replace("/login");
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const teamFlag = player ? ALL_TEAMS.find((t) => t.id === player.teamId)?.flag : null;

  const matchdays = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);

  // Find the first matchday that still has pending matches — treat it as "current"
  const currentMatchday = matchdays.find((day) =>
    matches.filter((m) => m.round === day).some((m) => !m.isCompleted)
  ) ?? matchdays[matchdays.length - 1];

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
        <h1 className="text-lg font-bold tracking-tight">EA FC 26 Ligi</h1>

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
          className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Puan Tablosu
        </Link>
        <Link
          href="/fixtures"
          className="px-3 py-2.5 text-sm font-medium border-b-2 border-primary text-foreground"
        >
          Fikstür
        </Link>
      </nav>

      <main className="flex flex-1 flex-col p-6 max-w-2xl w-full mx-auto space-y-6">
        {!tournamentStarted || matches.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Turnuva başladığında fikstür burada görünecek.</p>
          </div>
        ) : (
          matchdays.map((day) => {
            const dayMatches = matches.filter((m) => m.round === day);
            const allDone = dayMatches.every((m) => m.isCompleted);
            const isCurrent = day === currentMatchday;

            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{day}. Maç Günü</h2>
                  {isCurrent && !allDone && (
                    <Badge variant="default" className="text-xs">Güncel</Badge>
                  )}
                  {allDone && (
                    <Badge variant="secondary" className="text-xs">Tamamlandı</Badge>
                  )}
                </div>

                <div className="rounded-md border border-border divide-y divide-border">
                  {dayMatches.map((match) => {
                    const isMyMatch =
                      player &&
                      (match.homePlayer.playerName === player.playerName ||
                        match.awayPlayer.playerName === player.playerName);

                    return (
                      <div
                        key={match.id}
                        className={`flex items-center px-4 py-3 gap-3 ${isMyMatch ? "bg-primary/5" : ""}`}
                      >
                        {/* Home */}
                        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                          <div className="text-right min-w-0">
                            <p className={`text-sm leading-none truncate ${isMyMatch && match.homePlayer.playerName === player?.playerName ? "font-semibold" : ""}`}>
                              {match.homePlayer.teamName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{match.homePlayer.playerName}</p>
                          </div>
                          <Flag teamId={match.homePlayer.teamId} teamName={match.homePlayer.teamName} />
                        </div>

                        {/* Score / vs */}
                        <div className="w-16 text-center shrink-0">
                          {match.isCompleted ? (
                            <span className="text-sm font-bold tabular-nums">
                              {match.homeScore} – {match.awayScore}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">vs</span>
                          )}
                        </div>

                        {/* Away */}
                        <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                          <Flag teamId={match.awayPlayer.teamId} teamName={match.awayPlayer.teamName} />
                          <div className="min-w-0">
                            <p className={`text-sm leading-none truncate ${isMyMatch && match.awayPlayer.playerName === player?.playerName ? "font-semibold" : ""}`}>
                              {match.awayPlayer.teamName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{match.awayPlayer.playerName}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
