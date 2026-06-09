"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayersTab } from "@/components/admin/players-tab";
import { TeamsTab } from "@/components/admin/teams-tab";
import { MatchesTab } from "@/components/admin/matches-tab";
import { getAdminSession, clearAdminSession } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/stores/admin-store";

export default function AdminPage() {
  const router = useRouter();
  const { init, isInitialized, role, playerCount, disabledTeamCount } = useAdminStore();
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!getAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    init();
  }, [router, init]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  function handleLogout() {
    clearAdminSession();
    router.replace("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-bold">Yönetici Paneli</h1>
          <p className="text-xs text-muted-foreground">EA FC 26 Ligi</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm">Ayarlar</Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>Çıkış</Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        <Tabs defaultValue={isAdmin ? "players" : "matches"}>
          <div className="w-full overflow-x-auto overflow-y-hidden touch-pan-x py-px -my-px">
            <TabsList className="w-max">
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
          </div>

          <TabsContent value="players" className="space-y-4">
            <PlayersTab isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <TeamsTab />
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            <MatchesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
