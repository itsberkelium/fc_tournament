export function getTotalRounds(teamCount: number): number {
  return Math.log2(teamCount);
}

export function getRoundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Yarı Final";
  if (fromEnd === 2) return "Çeyrek Final";
  return `${Math.pow(2, fromEnd + 1)}'li Tur`;
}

// e.g. round=2, totalRounds=3, slot=0, side="home" → "Çeyrek Final 1. Maç Galibi"
export function getFeederLabel(round: number, totalRounds: number, slot: number, side: "home" | "away"): string {
  const prevRoundLabel = getRoundLabel(round - 1, totalRounds);
  const prevSlot = side === "home" ? slot * 2 : slot * 2 + 1;
  return `${prevRoundLabel} ${prevSlot + 1}. Maç Galibi`;
}

// e.g. totalRounds=3, side="home" → "Yarı Final 1. Maç Mağlubu"
export function getThirdPlaceFeederLabel(totalRounds: number, side: "home" | "away"): string {
  const semiLabel = getRoundLabel(totalRounds - 1, totalRounds);
  return `${semiLabel} ${side === "home" ? 1 : 2}. Maç Mağlubu`;
}
