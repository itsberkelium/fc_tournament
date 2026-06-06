import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Flag } from "@/components/flag";
import type { StandingRow } from "@/lib/standings";

type LeaderboardTableProps = {
  standings: StandingRow[];
  currentPlayerName?: string;
};

export function LeaderboardTable({ standings, currentPlayerName }: LeaderboardTableProps) {
  if (standings.length === 0) return null;

  return (
    <div className="rounded-md border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="w-8 text-center">#</TableHead>
            <TableHead>Takım / Oyuncu</TableHead>
            <TableHead className="text-center w-10" title="Oynanan">O</TableHead>
            <TableHead className="text-center w-10" title="Galibiyet">G</TableHead>
            <TableHead className="text-center w-10" title="Beraberlik">B</TableHead>
            <TableHead className="text-center w-10" title="Mağlubiyet">M</TableHead>
            <TableHead className="text-center w-10" title="Atılan Gol">AG</TableHead>
            <TableHead className="text-center w-10" title="Yenilen Gol">YG</TableHead>
            <TableHead className="text-center w-12" title="Averaj">Av</TableHead>
            <TableHead className="text-center w-10 font-bold" title="Puan">P</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((row, i) => {
            const isCurrentPlayer = row.playerName === currentPlayerName;
            return (
              <TableRow key={row.playerId} className={isCurrentPlayer ? "bg-primary/5 font-medium" : ""}>
                <TableCell className="text-center text-muted-foreground tabular-nums text-sm">{i + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <Flag teamId={row.teamId} teamName={row.teamName} size={32} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{row.teamName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{row.playerName}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums text-sm">{row.played}</TableCell>
                <TableCell className="text-center tabular-nums text-sm">{row.won}</TableCell>
                <TableCell className="text-center tabular-nums text-sm">{row.drawn}</TableCell>
                <TableCell className="text-center tabular-nums text-sm">{row.lost}</TableCell>
                <TableCell className="text-center tabular-nums text-sm">{row.goalsFor}</TableCell>
                <TableCell className="text-center tabular-nums text-sm">{row.goalsAgainst}</TableCell>
                <TableCell className={`text-center tabular-nums text-sm ${row.goalDiff > 0 ? "text-green-600 dark:text-green-400" : row.goalDiff < 0 ? "text-red-500" : ""}`}>
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </TableCell>
                <TableCell className="text-center tabular-nums text-sm font-bold">{row.points}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
