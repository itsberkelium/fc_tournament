import { create } from "zustand";
import { getStoredPlayer, clearStoredPlayer } from "@/lib/player-storage";
import { playerApi } from "@/lib/api";

export type PlayerInfo = {
  playerName: string;
  teamId: string;
  teamName: string;
};

type Router = { replace: (path: string) => void };

interface PlayerState {
  player: PlayerInfo | null;
  isLoading: boolean;
  loadPlayer: (router: Router) => Promise<void>;
  clearPlayer: (router: Router) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  isLoading: false,

  loadPlayer: async (router) => {
    if (get().player !== null) return;
    set({ isLoading: true });

    const stored = getStoredPlayer();
    if (!stored) {
      set({ isLoading: false });
      router.replace("/login");
      return;
    }

    try {
      const data = await playerApi.getMe(stored.playerName);
      if (!data.exists || !data.hasTeam || !data.player) {
        clearStoredPlayer();
        set({ isLoading: false, player: null });
        router.replace("/login");
        return;
      }
      set({
        player: {
          playerName: data.player.playerName,
          teamId: data.player.teamId,
          teamName: data.player.teamName,
        },
        isLoading: false,
      });
    } catch {
      clearStoredPlayer();
      set({ isLoading: false, player: null });
      router.replace("/login");
    }
  },

  clearPlayer: (router) => {
    clearStoredPlayer();
    set({ player: null });
    router.replace("/login");
  },
}));
