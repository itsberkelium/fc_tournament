"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredPlayer, setStoredPlayer } from "@/lib/player-storage";
import { playerApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredPlayer();
    if (stored) {
      checkAndRedirect(stored.playerName);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function checkAndRedirect(name: string) {
    try {
      const data = await playerApi.getMe(name);
      if (data.exists && data.player) {
        setStoredPlayer({ playerName: data.player.playerName });
        router.replace(data.hasTeam ? "/dashboard" : "/draft");
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = playerName.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data = await playerApi.getMe(trimmed);

      if (data.exists && data.player) {
        setStoredPlayer({ playerName: data.player.playerName });
        router.replace(data.hasTeam ? "/dashboard" : "/draft");
      } else if (data.registrationLocked) {
        setError("Kayıt şu an kapalı. Yöneticiyle iletişime geç.");
        setIsSubmitting(false);
      } else if (data.message) {
        setError(data.message);
        setIsSubmitting(false);
      } else {
        setStoredPlayer({ playerName: trimmed });
        router.replace("/draft");
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">EA FC 26</h1>
          <p className="text-muted-foreground text-sm">Lig Yöneticisi</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Giriş Yap</CardTitle>
            <CardDescription>
              Devam etmek için oyuncu adını gir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerName">Oyuncu Adı</Label>
                <Input
                  id="playerName"
                  placeholder="Adını gir..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!playerName.trim() || isSubmitting}
              >
                {isSubmitting ? "Yönlendiriliyor..." : "Devam Et"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
