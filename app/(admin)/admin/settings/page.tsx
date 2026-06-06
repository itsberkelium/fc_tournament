"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TournamentNameSection } from "@/components/admin/settings/tournament-name-section";
import { RegistrationLockSection } from "@/components/admin/settings/registration-lock-section";
import { ExportSection } from "@/components/admin/settings/export-section";
import { ResetSection } from "@/components/admin/settings/reset-section";
import { getAdminSession, getAdminPassword, clearAdminSession } from "@/lib/admin-auth";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tournamentName, setTournamentName] = useState("EA FC 26 Ligi");
  const [registrationLocked, setRegistrationLocked] = useState(false);

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${password}` }),
    [password]
  );

  useEffect(() => {
    if (!getAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setPassword(getAdminPassword());
  }, [router]);

  useEffect(() => {
    if (!password) return;
    fetch("/api/admin/settings", { headers: authHeaders() })
      .then((r) => r.json())
      .then(({ settings }) => {
        setTournamentName(settings.tournamentName ?? "EA FC 26 Ligi");
        setRegistrationLocked(settings.registrationLocked === "true");
      })
      .finally(() => setIsLoading(false));
  }, [password, authHeaders]);

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
        <TournamentNameSection initialName={tournamentName} password={password} />
        <Separator />
        <RegistrationLockSection initialLocked={registrationLocked} password={password} />
        <Separator />
        <ExportSection tournamentName={tournamentName} />
        <Separator />
        <ResetSection password={password} />
      </main>
    </div>
  );
}
