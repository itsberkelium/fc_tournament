"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminStore } from "@/lib/stores/admin-store";
import { adminApi } from "@/lib/api";

export function ResetSection() {
  const router = useRouter();
  const { password } = useAdminStore();
  const [resetInput, setResetInput] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    if (resetInput !== "SIFIRLA") return;
    setIsResetting(true);
    setError(null);
    try {
      const res = await adminApi.reset(password);
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Bir hata oluştu.");
      } else {
        setResetInput("");
        router.push("/admin");
      }
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-destructive">Tehlikeli Bölge</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tüm maçlar ve skorlar silinir. Oyuncu kayıtları korunur. Bu işlem geri alınamaz.
        </p>
      </div>
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 space-y-3">
        <Label className="text-sm">
          Onaylamak için <span className="font-mono font-bold">SIFIRLA</span> yaz:
        </Label>
        <Input
          value={resetInput}
          onChange={(e) => { setResetInput(e.target.value); setError(null); }}
          placeholder="SIFIRLA"
          className="max-w-xs font-mono"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          variant="destructive"
          disabled={resetInput !== "SIFIRLA" || isResetting}
          onClick={handleReset}
        >
          {isResetting ? "Sıfırlanıyor..." : "Turnuvayı Sıfırla"}
        </Button>
      </div>
    </section>
  );
}
