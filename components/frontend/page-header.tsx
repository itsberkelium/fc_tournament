"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/lib/stores/player-store";
import teams from "@/lib/teams.json";
import type { Team } from "@/types/Team";

const ALL_TEAMS = teams as Team[];

export function PageHeader({ tournamentName }: { tournamentName: string }) {
  const router = useRouter();
  const { player, loadPlayer, clearPlayer } = usePlayerStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPlayer(router);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const teamFlag = player ? ALL_TEAMS.find((t) => t.id === player.teamId)?.flag : null;

  return (
    <header className="border-b border-border px-6">
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full py-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-lg font-bold tracking-tight">{tournamentName}</h1>
        <span className="text-xs text-muted-foreground/40 font-mono">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
      </div>

      {player && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{player.playerName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{player.teamName}</p>
            </div>
            {teamFlag ? (
              <Image
                src={`https://flagcdn.com/w80/${teamFlag}.png`}
                alt={player.teamName}
                width={40}
                height={27}
                className="rounded shadow-sm"
                unoptimized
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {player.playerName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-1 w-44 rounded-md border border-border bg-popover shadow-md z-50">
              <button
                className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors rounded-md"
                onClick={() => {
                  setOpen(false);
                  clearPlayer(router);
                }}
              >
                Kullanıcı Değiştir
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </header>
  );
}
