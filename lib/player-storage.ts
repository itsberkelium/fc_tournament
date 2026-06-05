const PLAYER_KEY = "fc26_player";
const DRAFT_KEY = "fc26_draft";

export type StoredPlayer = {
  playerName: string;
};

export type DraftState = {
  rollCount: number;
  currentTeamId: string | null;
  seenTeamIds: string[];
};

export function getStoredPlayer(): StoredPlayer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    return raw ? (JSON.parse(raw) as StoredPlayer) : null;
  } catch {
    return null;
  }
}

export function setStoredPlayer(player: StoredPlayer): void {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
}

export function clearStoredPlayer(): void {
  localStorage.removeItem(PLAYER_KEY);
}

export function getDraftState(): DraftState {
  if (typeof window === "undefined") return { rollCount: 0, currentTeamId: null, seenTeamIds: [] };
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DraftState>) : {};
    return { rollCount: parsed.rollCount ?? 0, currentTeamId: parsed.currentTeamId ?? null, seenTeamIds: parsed.seenTeamIds ?? [] };
  } catch {
    return { rollCount: 0, currentTeamId: null, seenTeamIds: [] };
  }
}

export function setDraftState(state: DraftState): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
}

export function clearDraftState(): void {
  localStorage.removeItem(DRAFT_KEY);
}
