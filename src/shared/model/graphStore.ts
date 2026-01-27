import { createStore } from "@shared/lib/storeFactory";

interface GraphHistoryItem {
  id: string;
  expression: string;
  timestamp: number;
  tags?: string[];
}

interface SavedFunction {
  id: string;
  name: string;
  expression: string;
  date: number;
}

interface GraphState {
  history: GraphHistoryItem[];
  savedFunctions: SavedFunction[];

  logGraphAction: (expression: string, tags?: string[]) => void;
  saveFunction: (name: string, expression: string) => void;
  deleteSavedFunction: (id: string) => void;
  clearHistory: () => void;
}

export const useGraphStore = createStore<GraphState>(
  (set) => ({
    history: [],
    savedFunctions: [],

    logGraphAction: (expression, tags = []) =>
      set((state) => {
        // Prevent duplicates at the top of history
        if (
          state.history.length > 0 &&
          (state.history[0] as GraphHistoryItem).expression === expression
        ) {
          return state;
        }
        const newItem: GraphHistoryItem = {
          id: crypto.randomUUID(),
          expression,
          timestamp: Date.now(),
          tags,
        };
        return { history: [newItem, ...state.history].slice(0, 50) };
      }),

    saveFunction: (name, expression) =>
      set((state) => ({
        savedFunctions: [
          ...state.savedFunctions,
          { id: crypto.randomUUID(), name, expression, date: Date.now() },
        ],
      })),

    deleteSavedFunction: (id) =>
      set((state) => ({
        savedFunctions: state.savedFunctions.filter((f) => f.id !== id),
      })),

    clearHistory: () => set({ history: [] }),
  }),
  { name: "graph-calculator" }
);
