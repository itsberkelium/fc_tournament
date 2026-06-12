import { Badge } from "@/components/ui/badge";
import { MatchCard, type Match } from "@/components/fixtures/match-card";

type MatchdaySectionProps = {
  day: number;
  matches: Match[];
  isCurrentDay: boolean;
  showHeader: boolean;
  currentPlayerName?: string;
  perspectivePlayerId?: string;
  onSave: (matchId: string, homeScore: number, awayScore: number) => Promise<boolean>;
};

export function MatchdaySection({
  day,
  matches,
  isCurrentDay,
  showHeader,
  currentPlayerName,
  perspectivePlayerId,
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
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
}
