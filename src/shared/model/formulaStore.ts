import { logActivitySQL } from "@shared/api/sqliteService";
import { createStore } from "@shared/lib/storeFactory";

export interface FormulaInteraction {
  id: string;
  timestamp: number;
  type: "search" | "calculation";
  formulaId: string;
  formulaName: string;
  category: string;
  details?: string; // Bijv: "Input: m=10, a=9.8"
}

interface FormulaState {
  history: FormulaInteraction[];
  searchCounts: Record<string, number>; // Hoe vaak is elke formule opgezocht?

  // Actions
  logInteraction: (data: Omit<FormulaInteraction, "id" | "timestamp">) => void;
  getMostUsedCategory: () => string | null;
  clearHistory: () => void;
}

export const useFormulaStore = createStore<FormulaState>(
  (set, get) => ({
    history: [],
    searchCounts: {},

    logInteraction: (data) => {
      // 1. Log naar de centrale database voor XP/Activity stream
      const xp = data.type === "calculation" ? 5 : 1;
      const activityType =
        data.type === "calculation" ? "formula_calc" : "formula_search";

      try {
        logActivitySQL(
          activityType,
          `${data.type === "search" ? "Gelezen" : "Berekend"}: ${data.formulaName}`,
          xp,
        );
      } catch (e) {
        console.warn("SQL log failed", e);
      }

      // 2. Update lokale didactische state
      set((state) => {
        const newCounts = { ...state.searchCounts };
        if (data.type === "search") {
          newCounts[data.formulaId] = (newCounts[data.formulaId] || 0) + 1;
        }

        return {
          history: [
            { ...data, id: crypto.randomUUID(), timestamp: Date.now() },
            ...state.history
              .filter((h) => h.formulaId !== data.formulaId)
              .slice(0, 49), // Verwijder duplicaat en bewaar max 50
          ],
          searchCounts: newCounts,
        };
      });
    },

    getMostUsedCategory: () => {
      const { history } = get();
      if (!history.length) return null;

      const counts: Record<string, number> = {};
      history.forEach((h) => {
        counts[h.category] = (counts[h.category] || 0) + 1;
      });

      return (
        Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
      );
    },

    clearHistory: () => set({ history: [], searchCounts: {} }),
  }),
  { name: "binas-memory" }
);
