import { Badge } from "@/components/ui/badge";
import { MatchCard, type Match, type MatchPlayer } from "@/components/fixtures/match-card";

type MatchdaySectionProps = {
  day: number;
  matches: Match[];
  isCurrentDay: boolean;
  showHeader: boolean;
  currentPlayerName?: string;
  perspectivePlayerId?: string;
  onPlayerClick?: (player: MatchPlayer) => void;
  onSave: (matchId: string, homeScore: number, awayScore: number) => Promise<boolean>;
};

export function MatchdaySection({
  day,
  matches,
  isCurrentDay,
  showHeader,
  currentPlayerName,
  perspectivePlayerId,
  onPlayerClick,
  onSave,
}: MatchdaySectionProps) {
  const allDone = matches.every((m) => m.isCompleted);

  return (
    <div className="space-y-2">
      {showHeader && (
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{day}. Maç Günü</h2>
          {isCurrentDay && !allDone && <Badge variant="default" className="text-xs">Güncel</Badge>}
          {allDone && <Badge variant="secondary" className="text-xs">Tamamlandı</Badge>}
        </div>
      )}

      <div className="rounded-md border border-border divide-y divide-border">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            currentPlayerName={currentPlayerName}
            perspectivePlayerId={perspectivePlayerId}
            onPlayerClick={onPlayerClick}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
}
