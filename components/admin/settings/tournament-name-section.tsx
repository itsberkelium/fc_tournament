"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminStore } from "@/lib/stores/admin-store";
import { adminApi } from "@/lib/api";

export function TournamentNameSection({ initialName }: { initialName: string }) {
  const { password } = useAdminStore();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    await adminApi.updateSettings({ tournamentName: name }, password);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Turnuva Adı</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Oyunculara gösterilen lig adı.</p>
      </div>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="EA FC 26 Ligi"
          className="max-w-xs"
        />
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {success ? "Kaydedildi ✓" : saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </section>
  );
}
