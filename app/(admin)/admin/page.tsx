"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayersTab } from "@/components/admin/players-tab";
import { TeamsTab } from "@/components/admin/teams-tab";
import { MatchesTab } from "@/components/admin/matches-tab";
import { getAdminSession, getAdminPassword, clearAdminSession } from "@/lib/admin-auth";

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [disabledTeamCount, setDisabledTeamCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!getAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    const pw = getAdminPassword();
    setPassword(pw);

    Promise.all([
      fetch("/api/admin/players", { headers: { Authorization: `Bearer ${pw}` } }).then((r) => r.json()),
      fetch("/api/admin/tournament/status").then((r) => r.json()),
      fetch("/api/players/claimed-teams").then((r) => r.json()),
    ]).then(([playersData, statusData, teamsData]) => {
      setPlayerCount(playersData.players?.length ?? 0);
      setTournamentStarted(statusData.started ?? false);
      setDisabledTeamCount(teamsData.disabledTeamIds?.length ?? 0);
    }).finally(() => setIsLoading(false));
  }, [router]);

  function handleLogout() {
    clearAdminSession();
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
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-bold">Yönetici Paneli</h1>
          <p className="text-xs text-muted-foreground">EA FC 26 Ligi</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm">Ayarlar</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>Çıkış</Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="players">
          <TabsList>
            <TabsTrigger value="players">
              Oyuncular
              <Badge variant="secondary" className="ml-2 text-xs">{playerCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="teams">
              Takımlar
              {disabledTeamCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">{disabledTeamCount} devre dışı</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="matches">Maçlar</TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="space-y-4">
            {password && (
              <PlayersTab
                password={password}
                tournamentStarted={tournamentStarted}
                onTournamentStarted={() => setTournamentStarted(true)}
                onPlayerCountChange={setPlayerCount}
              />
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            {password && (
              <TeamsTab password={password} onDisabledCountChange={setDisabledTeamCount} />
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {password && (
              <MatchesTab password={password} tournamentStarted={tournamentStarted} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
