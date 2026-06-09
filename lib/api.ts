const JSON_HEADERS = { "Content-Type": "application/json" };
function bearer(pw: string) {
  return { ...JSON_HEADERS, Authorization: `Bearer ${pw}` };
}

export type PlayerInfo = {
  id: string;
  playerName: string;
  teamId: string;
  teamName: string;
};

export type MeResponse = {
  exists: boolean;
  hasTeam: boolean;
  registrationLocked?: boolean;
  player?: PlayerInfo;
};

export type ClaimedTeamsResponse = {
  claimedTeamIds: string[];
  disabledTeamIds: string[];
};

export type TournamentStatusResponse = { started: boolean };

export type StartTournamentBody = {
  doubleLegs: boolean;
  playoffEnabled: boolean;
  playoffTeamCount: number;
};

export type ScoreBody = { homeScore: number; awayScore: number };
export type PlayerScoreBody = ScoreBody & { playerName: string };
export type SettingsUpdateBody = { tournamentName?: string; registrationLocked?: string };

export type PlayerUpdateBody =
  | { action: "updatePermissions"; canEnterScore: boolean }
  | { action: "toggleDisabled" }
  | { action: "disqualify" };

export const playerApi = {
  getMe: (playerName: string): Promise<MeResponse> =>
    fetch(`/api/players/me?playerName=${encodeURIComponent(playerName)}`).then((r) => r.json()),

  lockIn: (playerName: string, teamId: string) =>
    fetch("/api/players/lock-in", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ playerName, teamId }),
    }),

  getClaimedTeams: (): Promise<ClaimedTeamsResponse> =>
    fetch("/api/players/claimed-teams").then((r) => r.json()),

  submitMatchScore: (id: string, body: PlayerScoreBody) =>
    fetch(`/api/matches/${id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    }),
};

export const adminApi = {
  getPlayers: (pw: string) =>
    fetch("/api/admin/players", { headers: bearer(pw) }).then((r) => r.json()),

  deletePlayer: (id: string, pw: string) =>
    fetch(`/api/admin/players/${id}`, { method: "DELETE", headers: bearer(pw) }),

  updatePlayer: (id: string, body: PlayerUpdateBody, pw: string) =>
    fetch(`/api/admin/players/${id}`, {
      method: "PATCH",
      headers: bearer(pw),
      body: JSON.stringify(body),
    }),

  getTournamentStatus: (): Promise<TournamentStatusResponse> =>
    fetch("/api/admin/tournament/status").then((r) => r.json()),

  startTournament: (body: StartTournamentBody, pw: string) =>
    fetch("/api/admin/tournament/start", {
      method: "POST",
      headers: bearer(pw),
      body: JSON.stringify(body),
    }),

  startPlayoffs: (pw: string) =>
    fetch("/api/admin/tournament/playoffs/start", { method: "POST", headers: bearer(pw) }),

  getMatches: (pw: string) =>
    fetch("/api/admin/matches", { headers: bearer(pw) }).then((r) => r.json()),

  saveMatchScore: (id: string, body: ScoreBody, pw: string) =>
    fetch(`/api/admin/matches/${id}`, {
      method: "PATCH",
      headers: bearer(pw),
      body: JSON.stringify(body),
    }),

  resetMatch: (id: string, pw: string) =>
    fetch(`/api/admin/matches/${id}`, { method: "DELETE", headers: bearer(pw) }),

  getClaimedTeams: (): Promise<ClaimedTeamsResponse> =>
    fetch("/api/players/claimed-teams").then((r) => r.json()),

  disableTeam: (teamId: string, pw: string) =>
    fetch(`/api/admin/teams/${teamId}`, { method: "POST", headers: bearer(pw) }),

  enableTeam: (teamId: string, pw: string) =>
    fetch(`/api/admin/teams/${teamId}`, { method: "DELETE", headers: bearer(pw) }),

  getSettings: (pw: string) =>
    fetch("/api/admin/settings", { headers: bearer(pw) }).then((r) => r.json()),

  updateSettings: (body: SettingsUpdateBody, pw: string) =>
    fetch("/api/admin/settings", {
      method: "PATCH",
      headers: bearer(pw),
      body: JSON.stringify(body),
    }),

  reset: (pw: string) =>
    fetch("/api/admin/tournament", { method: "DELETE", headers: bearer(pw) }),
};

export const publicApi = {
  getLeaderboard: () => fetch("/api/leaderboard").then((r) => r.json()),
  getFixtures: () => fetch("/api/fixtures").then((r) => r.json()),
  getPlayoffs: () => fetch("/api/playoffs").then((r) => r.json()),
};
