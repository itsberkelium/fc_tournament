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
