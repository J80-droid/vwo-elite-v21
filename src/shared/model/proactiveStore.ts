import { getProactiveEngine } from "@shared/api/ai-brain/proactiveEngine";
import { createStore } from "@shared/lib/storeFactory";
import type { ProactiveSuggestion } from "@shared/types/ai-brain";

interface ProactiveState {
  suggestions: ProactiveSuggestion[];
  dismissedIds: string[];
  isLoading: boolean;
  lastRefresh: number;

  // Actions
  fetchSuggestions: () => Promise<void>;
  dismissSuggestion: (id: string) => void;
  clearAll: () => void;
}

export const useProactiveStore = createStore<
  ProactiveState,
  { dismissedIds: string[] }
>(
  (set, get) => ({
    suggestions: [],
    dismissedIds: [],
    isLoading: false,
    lastRefresh: 0,

    fetchSuggestions: async () => {
      if (get().isLoading) return;

      set({ isLoading: true });
      try {
        const engine = getProactiveEngine();
        const allSuggestions = await engine.getSuggestions();

        // Filter out dismissed
        const visible = allSuggestions.filter(
          (s) => !get().dismissedIds.includes(s.id),
        );

        set({
          suggestions: visible,
          isLoading: false,
          lastRefresh: Date.now(),
        });
      } catch (e) {
        console.error("[ProactiveStore] Failed to fetch suggestions:", e);
        set({ isLoading: false });
      }
    },

    dismissSuggestion: (id: string) => {
      set((state) => ({
        dismissedIds: [...state.dismissedIds, id],
        suggestions: state.suggestions.filter((s) => s.id !== id),
      }));
    },

    clearAll: () => {
      set({ suggestions: [], dismissedIds: [] });
    },
  }),
  {
    name: "proactive-suggestions",
    persistOptions: {
      partialize: (state) => ({ dismissedIds: state.dismissedIds }),
    },
  }
);
