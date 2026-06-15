"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminApi } from "@/lib/api";
import { useAdminStore } from "@/lib/stores/admin-store";
import type { Player } from "@/components/admin/delete-player-dialog";

type AffectedMatch = { id: string; opponentName: string };

type Step = "idle" | "confirm-disqualify" | "done-disqualify" | "confirm-reset";

type Props = {
  player: Player | null;
  onClose: () => void;
  onUpdated: (updated: Player) => void;
};

export function EditPlayerDialog({ player, onClose, onUpdated }: Props) {
  const { password } = useAdminStore();
  const [canEnterScore, setCanEnterScore] = useState(player?.canEnterScore ?? true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [affectedMatches, setAffectedMatches] = useState<AffectedMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentCanEnterScore = player?.canEnterScore ?? true;

  async function handleSavePermissions() {
    if (!player) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi.updatePlayer(player.id, { action: "updatePermissions", canEnterScore }, password);
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      onUpdated(data.player);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleDisabled() {
    if (!player) return;
    setToggling(true);
    setError(null);
    try {
      const res = await adminApi.updatePlayer(player.id, { action: "toggleDisabled" }, password);
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      onUpdated(data.player);
      onClose();
    } finally {
      setToggling(false);
    }
  }

  async function handleDisqualify() {
    if (!player) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi.updatePlayer(player.id, { action: "disqualify" }, password);
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setAffectedMatches(data.affectedMatches ?? []);
      setStep("done-disqualify");
      onUpdated(data.player);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!player) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi.updatePlayer(player.id, { action: "reset" }, password);
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      onUpdated(data.player);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!player) return null;

  return (
    <Dialog open={!!player} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{player.playerName}</DialogTitle>
          <p className="text-sm text-muted-foreground">{player.teamName}</p>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {step === "done-disqualify" ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">Oyuncu diskalifiye edildi.</p>
            {affectedMatches.length > 0 ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {affectedMatches.length} maç rakip lehine 3-0 tamamlandı:
                </p>
                <ul className="text-sm space-y-0.5 pl-3">
                  {affectedMatches.map((m) => (
                    <li key={m.id} className="text-muted-foreground">• {m.opponentName} kazandı</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bekleyen maç bulunmuyordu.</p>
            )}
            <DialogFooter>
              <Button onClick={onClose}>Kapat</Button>
            </DialogFooter>
          </div>
        ) : step === "confirm-disqualify" ? (
          <div className="space-y-3">
            <p className="text-sm">
              <strong>{player.playerName}</strong> diskalifiye edilecek. Bu işlem geri alınamaz.
            </p>
            <p className="text-sm text-muted-foreground">
              Tüm bekleyen maçlar rakip lehine 3-0 olarak tamamlanacak.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("idle")} disabled={saving}>İptal</Button>
              <Button variant="destructive" onClick={handleDisqualify} disabled={saving}>
                {saving ? "İşleniyor..." : "Evet, Diskalifiye Et"}
              </Button>
            </DialogFooter>
          </div>
        ) : step === "confirm-reset" ? (
          <div className="space-y-3">
            <p className="text-sm">
              <strong>{player.playerName}</strong> sıfırlanacak.
            </p>
            <p className="text-sm text-muted-foreground">
              Diskalifiye ve devre dışı durumları kaldırılacak, tüm maç skorları silinecek.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("idle")} disabled={saving}>İptal</Button>
              <Button variant="destructive" onClick={handleReset} disabled={saving}>
                {saving ? "Sıfırlanıyor..." : "Evet, Sıfırla"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Permissions */}
            <div className="space-y-2">
              <p className="text-sm font-medium">İzinler</p>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={canEnterScore}
                  onChange={(e) => setCanEnterScore(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
                <span className="text-sm">Skor girişi</span>
              </label>
            </div>

            <div className="border-t border-border" />

            {/* Account status */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Hesap Durumu</p>
              <div className="flex gap-2">
                <Button
                  variant={player.isDisabled ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleDisabled}
                  disabled={toggling || player.isDisqualified}
                >
                  {toggling ? "..." : player.isDisabled ? "Aktif Et" : "Devre Dışı Bırak"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setStep("confirm-disqualify")}
                  disabled={player.isDisqualified}
                >
                  {player.isDisqualified ? "Diskalifiye Edildi" : "Diskalifiye Et"}
                </Button>
              </div>
              {player.isDisqualified && (
                <p className="text-xs text-muted-foreground">Bu oyuncu diskalifiye edildi.</p>
              )}
            </div>

            <div className="border-t border-border" />

            {/* Reset */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Sıfırla</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("confirm-reset")}
              >
                Oyuncuyu Sıfırla
              </Button>
              <p className="text-xs text-muted-foreground">
                Tüm maçları, diskalifiye ve ban durumunu sıfırlar.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>İptal</Button>
              <Button
                onClick={handleSavePermissions}
                disabled={saving || canEnterScore === currentCanEnterScore}
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
