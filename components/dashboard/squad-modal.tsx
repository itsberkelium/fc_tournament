"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Flag } from "@/components/flag";
import { MatchdaySection } from "@/components/fixtures/matchday-section";
import type { Match } from "@/components/fixtures/match-card";
import type { StandingRow } from "@/lib/standings";

type SquadPlayer = { pos: string; name: string; club: string };

const POS_LABELS: Record<string, string> = {
  GK: "Kaleciler",
  DF: "Defans",
  MF: "Orta Saha",
  FW: "Forvet",
};

type Props = {
  row: StandingRow | null;
  onClose: () => void;
};

export function SquadModal({ row, onClose }: Props) {
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [squadLoading, setSquadLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  useEffect(() => {
    if (!row) return;

    setSquad([]);
    setSquadLoading(true);
    fetch(`/api/squad/${row.teamId}`)
      .then((r) => r.json())
      .then((data) => setSquad(data.squad ?? []))
      .catch(() => setSquad([]))
      .finally(() => setSquadLoading(false));

    setMatches([]);
    setMatchesLoading(true);
    fetch("/api/fixtures")
      .then((r) => r.json())
      .then((data: { matches: Match[] }) => {
        const playerMatches = (data.matches ?? []).filter(
          (m) =>
            !m.isPlayoff &&
            (m.homePlayer.id === row.playerId || m.awayPlayer.id === row.playerId)
        );
        setMatches(playerMatches);
      })
      .catch(() => setMatches([]))
      .finally(() => setMatchesLoading(false));
  }, [row?.teamId, row?.playerId]);

  const grouped = squad.reduce<Record<string, SquadPlayer[]>>((acc, p) => {
    (acc[p.pos] ??= []).push(p);
    return acc;
  }, {});

  const matchesByRound = matches.reduce<Record<number, Match[]>>((acc, m) => {
    (acc[m.round] ??= []).push(m);
    return acc;
  }, {});
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  return (
    <Dialog open={!!row} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          {row && (
            <div className="flex items-center gap-3">
              <Flag teamId={row.teamId} teamName={row.teamName} size={40} />
              <div>
                <DialogTitle>{row.teamName}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{row.playerName}</p>
              </div>
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="squad" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="shrink-0 w-full">
            <TabsTrigger value="squad" className="flex-1">Kadro</TabsTrigger>
            <TabsTrigger value="matches" className="flex-1">Maçlar</TabsTrigger>
          </TabsList>

          <TabsContent value="squad" className="overflow-y-auto flex-1 pr-1 mt-2">
            {squadLoading && (
              <p className="text-sm text-muted-foreground text-center py-6">Yükleniyor...</p>
            )}
            {!squadLoading && squad.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Bu takım için kadro verisi bulunamadı.
              </p>
            )}
            {!squadLoading && squad.length > 0 && (
              <div className="space-y-4 pt-1">
                {(["GK", "DF", "MF", "FW"] as const).map((pos) => {
                  const players = grouped[pos];
                  if (!players?.length) return null;
                  return (
                    <div key={pos}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {POS_LABELS[pos]}
                      </h4>
                      <div className="space-y-1.5">
                        {players.map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-sm gap-2">
                            <span className="font-medium shrink-0">{p.name}</span>
                            {p.club && (
                              <span className="text-xs text-muted-foreground truncate text-right">{p.club}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches" className="overflow-y-auto flex-1 pr-1 mt-2">
            {matchesLoading && (
              <p className="text-sm text-muted-foreground text-center py-6">Yükleniyor...</p>
            )}
            {!matchesLoading && matches.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Henüz maç oynanmadı.
              </p>
            )}
            {!matchesLoading && matches.length > 0 && (
              <div className="space-y-4 pt-1">
                {rounds.map((round) => (
                  <MatchdaySection
                    key={round}
                    day={round}
                    matches={matchesByRound[round] as Match[]}
                    isCurrentDay={false}
                    showHeader
                    perspectivePlayerId={row?.playerId}
                    onSave={async (): Promise<boolean> => false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
