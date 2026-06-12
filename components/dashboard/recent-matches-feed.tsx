"use client";

import { Flag } from "@/components/flag";
import type { RecentMatch } from "@/lib/api";

type Props = { matches: RecentMatch[] };

export function RecentMatchesFeed({ matches }: Props) {
  if (matches.length === 0) return null;

  return (
    <div>
      <h2 className="text-base font-semibold mb-3">Son Sonuçlar</h2>
      <div className="rounded-md border border-border divide-y divide-border">
        {matches.map((m) => (
          <div key={m.id} className="flex items-center gap-2 px-4 py-2.5">
            <span className="text-xs text-muted-foreground w-14 shrink-0">{m.round}. Gün</span>
            <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
              <p className="text-xs text-muted-foreground truncate hidden xs:block">{m.homePlayer.playerName}</p>
              <p className="text-sm font-medium truncate">{m.homePlayer.teamName}</p>
              <Flag teamId={m.homePlayer.teamId} teamName={m.homePlayer.teamName} size={20} />
            </div>
            <div className="shrink-0 text-center w-16">
              <span className={`text-sm font-bold tabular-nums ${m.homeScore > m.awayScore ? "text-green-600 dark:text-green-400" : m.homeScore < m.awayScore ? "text-red-500" : ""}`}>
                {m.homeScore}
              </span>
              <span className="text-sm text-muted-foreground mx-0.5">–</span>
              <span className={`text-sm font-bold tabular-nums ${m.awayScore > m.homeScore ? "text-green-600 dark:text-green-400" : m.awayScore < m.homeScore ? "text-red-500" : ""}`}>
                {m.awayScore}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Flag teamId={m.awayPlayer.teamId} teamName={m.awayPlayer.teamName} size={20} />
              <p className="text-sm font-medium truncate">{m.awayPlayer.teamName}</p>
              <p className="text-xs text-muted-foreground truncate hidden xs:block">{m.awayPlayer.playerName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
