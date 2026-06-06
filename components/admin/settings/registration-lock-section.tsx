"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RegistrationLockSectionProps = {
  initialLocked: boolean;
  password: string;
};

export function RegistrationLockSection({ initialLocked, password }: RegistrationLockSectionProps) {
  const [locked, setLocked] = useState(initialLocked);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    const next = !locked;
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
      body: JSON.stringify({ registrationLocked: String(next) }),
    });
    setLocked(next);
    setSaving(false);
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Kayıt Kilidi</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Kapalıyken yeni oyuncular takım seçemez.</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={locked ? "destructive" : "secondary"}>
          {locked ? "Kayıt Kapalı" : "Kayıt Açık"}
        </Badge>
        <Button
          size="sm"
          variant={locked ? "outline" : "destructive"}
          onClick={handleToggle}
          disabled={saving}
        >
          {saving ? "..." : locked ? "Kaydı Aç" : "Kaydı Kapat"}
        </Button>
      </div>
    </section>
  );
}
