"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAdminSession, getAdminPassword, clearAdminSession } from "@/lib/admin-auth";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Settings state
  const [tournamentName, setTournamentName] = useState("");
  const [registrationLocked, setRegistrationLocked] = useState(false);

  // Save states
  const [savingName, setSavingName] = useState(false);
  const [savingLock, setSavingLock] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Reset state
  const [resetInput, setResetInput] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const [error, setError] = useState<string | null>(null);

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
    setIsLoading(true);
    fetch("/api/admin/settings", { headers: authHeaders() })
      .then((r) => r.json())
      .then(({ settings }) => {
        setTournamentName(settings.tournamentName ?? "EA FC 26 Ligi");
        setRegistrationLocked(settings.registrationLocked === "true");
      })
      .catch(() => setError("Ayarlar yüklenemedi."))
      .finally(() => setIsLoading(false));
  }, [password, authHeaders]);

  async function handleSaveName() {
    setSavingName(true);
    setNameSuccess(false);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ tournamentName }),
    });
    setSavingName(false);
    setNameSuccess(true);
    setTimeout(() => setNameSuccess(false), 2000);
  }

  async function handleToggleLock() {
    setSavingLock(true);
    const next = !registrationLocked;
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ registrationLocked: String(next) }),
    });
    setRegistrationLocked(next);
    setSavingLock(false);
  }

  async function handleReset() {
    if (resetInput !== "SIFIRLA") return;
    setIsResetting(true);
    setResetError(null);
    try {
      const res = await fetch("/api/admin/tournament", {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        setResetError(data.message ?? "Bir hata oluştu.");
      } else {
        setResetInput("");
        router.push("/admin");
      }
    } catch {
      setResetError("Bir hata oluştu.");
    } finally {
      setIsResetting(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const [leaderboardRes, fixturesRes] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch("/api/fixtures"),
      ]);
      const { standings } = await leaderboardRes.json();
      const { matches } = await fixturesRes.json();

      // Standings CSV
      const standingsCsv = [
        ["Sıra", "Takım", "Oyuncu", "O", "G", "B", "M", "AG", "YG", "Av", "P"],
        ...standings.map((r: {
          teamName: string; playerName: string; played: number; won: number; drawn: number;
          lost: number; goalsFor: number; goalsAgainst: number; goalDiff: number; points: number;
        }, i: number) => [
          i + 1, r.teamName, r.playerName, r.played, r.won, r.drawn,
          r.lost, r.goalsFor, r.goalsAgainst, r.goalDiff, r.points,
        ]),
      ].map((row) => row.join(",")).join("\n");

      // Fixtures CSV
      const fixturesCsv = [
        ["Maç Günü", "Ev Sahibi Takım", "Ev Sahibi Oyuncu", "Deplasman Takım", "Deplasman Oyuncu", "Ev Skoru", "Deplasman Skoru"],
        ...matches.map((m: {
          round: number; homePlayer: { teamName: string; playerName: string };
          awayPlayer: { teamName: string; playerName: string };
          homeScore: number | null; awayScore: number | null;
        }) => [
          m.round, m.homePlayer.teamName, m.homePlayer.playerName,
          m.awayPlayer.teamName, m.awayPlayer.playerName,
          m.homeScore ?? "", m.awayScore ?? "",
        ]),
      ].map((row) => row.join(",")).join("\n");

      const combined = `PUAN TABLOSU\n${standingsCsv}\n\nFİKSTÜR\n${fixturesCsv}`;
      const blob = new Blob([combined], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournamentName.replace(/\s+/g, "_")}_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

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
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tournament name */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Turnuva Adı</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Oyunculara gösterilen lig adı.</p>
          </div>
          <div className="flex gap-2">
            <Input
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="EA FC 26 Ligi"
              className="max-w-xs"
            />
            <Button onClick={handleSaveName} disabled={savingName || !tournamentName.trim()}>
              {nameSuccess ? "Kaydedildi ✓" : savingName ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </section>

        <Separator />

        {/* Registration lock */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Kayıt Kilidi</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kapalıyken yeni oyuncular takım seçemez.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={registrationLocked ? "destructive" : "secondary"}>
              {registrationLocked ? "Kayıt Kapalı" : "Kayıt Açık"}
            </Badge>
            <Button
              size="sm"
              variant={registrationLocked ? "outline" : "destructive"}
              onClick={handleToggleLock}
              disabled={savingLock}
            >
              {savingLock ? "..." : registrationLocked ? "Kaydı Aç" : "Kaydı Kapat"}
            </Button>
          </div>
        </section>

        <Separator />

        {/* Export */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Veri Dışa Aktar</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Puan tablosunu ve fikstürü CSV olarak indir.
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Hazırlanıyor..." : "CSV İndir"}
          </Button>
        </section>

        <Separator />

        {/* Danger zone */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-destructive">Tehlikeli Bölge</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tüm maçlar ve skorlar silinir. Oyuncu kayıtları korunur.
              Bu işlem geri alınamaz.
            </p>
          </div>
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 space-y-3">
            <Label className="text-sm">
              Onaylamak için <span className="font-mono font-bold">SIFIRLA</span> yaz:
            </Label>
            <Input
              value={resetInput}
              onChange={(e) => { setResetInput(e.target.value); setResetError(null); }}
              placeholder="SIFIRLA"
              className="max-w-xs font-mono"
            />
            {resetError && <p className="text-xs text-destructive">{resetError}</p>}
            <Button
              variant="destructive"
              disabled={resetInput !== "SIFIRLA" || isResetting}
              onClick={handleReset}
            >
              {isResetting ? "Sıfırlanıyor..." : "Turnuvayı Sıfırla"}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
