"use client";

import { useEffect, useState } from "react";
import { X, Share, PlusSquare } from "lucide-react";

const STORAGE_KEY = "fc26_pwa_dismissed";

type Mode = "android" | "ios";

export function PwaInstallBanner() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [prompt, setPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as unknown as Record<string, unknown>).MSStream;

    if (isIos) {
      setMode("ios");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as typeof prompt);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setMode(null);
  };

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") dismiss();
  };

  if (!mode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border border-border bg-card shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-start justify-between p-4 pb-2">
        <p className="text-sm font-semibold">Uygulamayı Yükle</p>
        <button
          onClick={dismiss}
          className="ml-2 -mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Kapat"
        >
          <X size={16} />
        </button>
      </div>

      {mode === "android" && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-3">
            Bu uygulamayı ana ekranına ekleyerek daha hızlı erişebilirsin.
          </p>
          <button
            onClick={install}
            className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ana Ekrana Ekle
          </button>
        </div>
      )}

      {mode === "ios" && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-3">
            Ana ekrana eklemek için:
          </p>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">1</span>
              <span>Alttaki <Share size={11} className="inline -mt-0.5" /> <strong className="text-foreground">Paylaş</strong> düğmesine bas</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">2</span>
              <span><PlusSquare size={11} className="inline -mt-0.5" /> <strong className="text-foreground">Ana Ekrana Ekle</strong>'yi seç</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
