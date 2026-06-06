import { Badge } from "@/components/ui/badge";
import { MatchCard, type Match } from "@/components/fixtures/match-card";

type ScoreInput = { home: string; away: string };

type MatchdaySectionProps = {
  day: number;
  matches: Match[];
  isCurrentDay: boolean;
  showHeader: boolean;
  currentPlayerName?: string;
  scoreInputs: Record<string, ScoreInput>;
  savingMatchId: string | null;
  onScoreChange: (matchId: string, field: "home" | "away", value: string) => void;
  onSave: (matchId: string) => void;
  onEdit: (match: Match) => void;
  onCancelEdit: (matchId: string) => void;
};

export function MatchdaySection({
  day,
  matches,
  isCurrentDay,
  showHeader,
  currentPlayerName,
  scoreInputs,
  savingMatchId,
  onScoreChange,
  onSave,
  onEdit,
  onCancelEdit,
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
            scoreInput={scoreInputs[match.id]}
            isSaving={savingMatchId === match.id}
            onScoreChange={onScoreChange}
            onSave={onSave}
            onEdit={onEdit}
            onCancelEdit={onCancelEdit}
          />
        ))}
      </div>
    </div>
  );
}
