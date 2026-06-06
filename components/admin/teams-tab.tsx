"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import teams from "@/lib/teams.json";
import type { Team } from "@/types/Team";

const ALL_TEAMS = teams as Team[];

type SortField = "name" | "rating" | "status";

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

type TeamsTabProps = {
  password: string;
  onDisabledCountChange?: (count: number) => void;
};

export function TeamsTab({ password, onDisabledCountChange }: TeamsTabProps) {
  const [claimedTeamIds, setClaimedTeamIds] = useState<string[]>([]);
  const [disabledTeamIds, setDisabledTeamIds] = useState<string[]>([]);
  const [togglingTeamId, setTogglingTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSort, setTeamSort] = useState<SortField>("name");
  const [teamSortDir, setTeamSortDir] = useState<"asc" | "desc">("asc");

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${password}` }),
    [password]
  );

  useEffect(() => {
    if (!password) return;
    fetch("/api/players/claimed-teams")
      .then((r) => r.json())
      .then(({ claimedTeamIds, disabledTeamIds }) => {
        setClaimedTeamIds(claimedTeamIds ?? []);
        const disabled = disabledTeamIds ?? [];
        setDisabledTeamIds(disabled);
        onDisabledCountChange?.(disabled.length);
      })
      .finally(() => setIsLoading(false));
  }, [password]);

  async function handleToggleTeam(teamId: string) {
    setTogglingTeamId(teamId);
    const isDisabled = disabledTeamIds.includes(teamId);
    try {
      await fetch(`/api/admin/teams/${teamId}`, {
        method: isDisabled ? "DELETE" : "POST",
        headers: authHeaders(),
      });
      setDisabledTeamIds((prev) => {
        const next = isDisabled ? prev.filter((id) => id !== teamId) : [...prev, teamId];
        onDisabledCountChange?.(next.length);
        return next;
      });
    } finally {
      setTogglingTeamId(null);
    }
  }

  function handleSort(field: string) {
    if (teamSort === field) setTeamSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setTeamSort(field as SortField); setTeamSortDir("asc"); }
  }

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

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Yükleniyor...</div>;

  return (
    <div className="space-y-4">
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
              <TableHead><SortButton label="Takım" field="name" current={teamSort} dir={teamSortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-center"><SortButton label="OVR" field="rating" current={teamSort} dir={teamSortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-center"><SortButton label="Durum" field="status" current={teamSort} dir={teamSortDir} onSort={handleSort} /></TableHead>
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
    </div>
  );
}
