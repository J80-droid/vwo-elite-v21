import { createStore } from "@shared/lib/storeFactory";

export interface ContextSet {
  id: string;
  name: string;
  subject: string;
  materialIds: string[];
  createdAt: number;
  updatedAt: number;
}

interface ContextSetState {
  sets: ContextSet[];

  // Actions
  addSet: (set: Omit<ContextSet, "id" | "createdAt" | "updatedAt">) => string;
  updateSet: (
    id: string,
    updates: Partial<Omit<ContextSet, "id" | "createdAt">>,
  ) => void;
  deleteSet: (id: string) => void;
  getSetsBySubject: (subject: string) => ContextSet[];
  getSetById: (id: string) => ContextSet | undefined;
}

export const useContextSetStore = createStore<ContextSetState>(
  (set, get) => ({
    sets: [],

    addSet: (newSet) => {
      const id = crypto.randomUUID();
      const now = Date.now();

      set((state) => ({
        sets: [
          ...state.sets,
          {
            ...newSet,
            id,
            createdAt: now,
            updatedAt: now,
          },
        ],
      }));

      return id;
    },

    updateSet: (id, updates) => {
      set((state) => ({
        sets: state.sets.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s,
        ),
      }));
    },

    deleteSet: (id) => {
      set((state) => ({
        sets: state.sets.filter((s) => s.id !== id),
      }));
    },

    getSetsBySubject: (subject) => {
      return get().sets.filter((s) => s.subject === subject);
    },

    getSetById: (id) => {
      return get().sets.find((s) => s.id === id);
    },
  }),
  {
    name: "context-sets",
  }
);
