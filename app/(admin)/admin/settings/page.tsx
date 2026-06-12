"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TournamentNameSection } from "@/components/admin/settings/tournament-name-section";
import { RegistrationLockSection } from "@/components/admin/settings/registration-lock-section";
import { ExportSection } from "@/components/admin/settings/export-section";
import { ResetSection } from "@/components/admin/settings/reset-section";
import { getAdminSession, clearAdminSession, getAdminRole } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/stores/admin-store";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { init, password } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [tournamentName, setTournamentName] = useState("EA FC 26 Ligi");
  const [registrationLocked, setRegistrationLocked] = useState(false);

  useEffect(() => {
    if (!getAdminSession() || getAdminRole() !== "admin") {
      router.replace("/admin");
      return;
    }
    init();
  }, [router, init]);

  useEffect(() => {
    if (!password) return;
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${password}` } })
      .then((r) => r.json())
      .then(({ settings }) => {
        setTournamentName(settings.tournamentName ?? "EA FC 26 Ligi");
        setRegistrationLocked(settings.registrationLocked === "true");
      })
      .finally(() => setIsLoading(false));
  }, [password]);

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
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Geri
          </Link>
          <div>
            <h1 className="text-lg font-bold">Ayarlar</h1>
            <p className="text-xs text-muted-foreground">{tournamentName}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>Çıkış</Button>
      </header>

      <main className="flex-1 p-6 max-w-xl mx-auto w-full space-y-8">
        <TournamentNameSection initialName={tournamentName} />
        <Separator />
        <RegistrationLockSection initialLocked={registrationLocked} />
        <Separator />
        <ExportSection tournamentName={tournamentName} />
        <Separator />
        <ResetSection />
        <Separator />
        <div>
          <p className="text-sm font-medium mb-1">Versiyon</p>
          <p className="text-2xl font-bold tabular-nums">v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
        </div>
      </main>
    </div>
  );
}
