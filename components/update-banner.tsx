"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const POLL_INTERVAL = 3 * 60 * 1000; // 3 minutes

export function UpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const current = process.env.NEXT_PUBLIC_APP_VERSION;
    if (!current) return;

    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { version } = await res.json();
        if (version && version !== current) setShow(true);
      } catch {
        // network error — ignore
      }
    };

    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-primary px-4 py-2.5 text-primary-foreground text-sm font-medium shadow-lg">
      <RefreshCw size={15} className="shrink-0" />
      <span>Yeni güncelleme mevcut.</span>
      <button
        onClick={() => window.location.reload()}
        className="underline underline-offset-2 hover:no-underline"
      >
        Yenilemek için dokun
      </button>
    </div>
  );
}
