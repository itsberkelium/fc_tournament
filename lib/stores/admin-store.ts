import { create } from "zustand";
import { getAdminPassword } from "@/lib/admin-auth";
import { adminApi } from "@/lib/api";

interface AdminState {
  password: string;
  tournamentStarted: boolean;
  playerCount: number;
  disabledTeamCount: number;
  isInitialized: boolean;
  init: () => Promise<void>;
  setTournamentStarted: (v: boolean) => void;
  setPlayerCount: (n: number) => void;
  setDisabledTeamCount: (n: number) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  password: "",
  tournamentStarted: false,
  playerCount: 0,
  disabledTeamCount: 0,
  isInitialized: false,

  init: async () => {
    if (get().isInitialized) return;
    const pw = getAdminPassword();
    set({ password: pw });

    const [playersData, statusData, teamsData] = await Promise.all([
      adminApi.getPlayers(pw),
      adminApi.getTournamentStatus(),
      adminApi.getClaimedTeams(),
    ]);

    set({
      playerCount: playersData.players?.length ?? 0,
      tournamentStarted: statusData.started ?? false,
      disabledTeamCount: teamsData.disabledTeamIds?.length ?? 0,
      isInitialized: true,
    });
  },

  setTournamentStarted: (v) => set({ tournamentStarted: v }),
  setPlayerCount: (n) => set({ playerCount: n }),
  setDisabledTeamCount: (n) => set({ disabledTeamCount: n }),
}));
