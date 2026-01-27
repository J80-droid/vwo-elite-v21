import { createStore } from "@shared/lib/storeFactory";

export interface LiteratureItem {
  id: string;
  title: string;
  author: string;
  period?: string;
  theme?: string;
  genre?: string;
  status: "unread" | "reading" | "finished";
  oralNotes?: string;
  rating?: number;
  quotes?: string[];
  characters?: string[];
  addedAt: number;
  finishedAt?: number;
}

interface LiteratureState {
  items: Record<string, LiteratureItem[]>; // Key = subject name

  // Actions
  addItem: (
    subject: string,
    item: Omit<LiteratureItem, "id" | "addedAt">,
  ) => string;
  updateItem: (
    subject: string,
    id: string,
    updates: Partial<LiteratureItem>,
  ) => void;
  deleteItem: (subject: string, id: string) => void;
  getItems: (subject: string) => LiteratureItem[];
  getFinishedCount: (subject: string) => number;
  importItems: (subject: string, items: LiteratureItem[]) => void;
}

// Default VWO literature for common subjects
const DEFAULT_LITERATURE: Record<string, LiteratureItem[]> = {
  Nederlands: [
    {
      id: "1",
      title: "Het diner",
      author: "Herman Koch",
      period: "Heden",
      theme: "Moraal & Familie",
      genre: "Roman",
      status: "unread",
      addedAt: Date.now(),
    },
    {
      id: "2",
      title: "De avonden",
      author: "Gerard Reve",
      period: "Naoorlogs",
      theme: "Existentiële leegte",
      genre: "Roman",
      status: "unread",
      addedAt: Date.now(),
    },
    {
      id: "3",
      title: "Max Havelaar",
      author: "Multatuli",
      period: "Romantiek",
      theme: "Kolonialisme",
      genre: "Roman",
      status: "unread",
      addedAt: Date.now(),
    },
  ],
  Engels: [
    {
      id: "1",
      title: "1984",
      author: "George Orwell",
      period: "Modernism",
      theme: "Totalitarianism",
      genre: "Dystopian Fiction",
      status: "unread",
      addedAt: Date.now(),
    },
    {
      id: "2",
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      period: "Jazz Age",
      theme: "American Dream",
      genre: "Novel",
      status: "unread",
      addedAt: Date.now(),
    },
  ],
  Frans: [
    {
      id: "1",
      title: "L'Étranger",
      author: "Albert Camus",
      period: "Absurdisme",
      theme: "Aliénation",
      genre: "Roman",
      status: "unread",
      addedAt: Date.now(),
    },
  ],
};

export const useLiteratureStore = createStore<LiteratureState>(
  (set, get) => ({
    items: DEFAULT_LITERATURE,

    addItem: (subject, item) => {
      const id = crypto.randomUUID();
      const newItem: LiteratureItem = {
        ...item,
        id,
        addedAt: Date.now(),
      };

      set((state) => ({
        items: {
          ...state.items,
          [subject]: [...(state.items[subject] || []), newItem],
        },
      }));

      return id;
    },

    updateItem: (subject, id, updates) => {
      set((state) => ({
        items: {
          ...state.items,
          [subject]: (state.items[subject] || []).map((item) =>
            item.id === id
              ? {
                ...item,
                ...updates,
                finishedAt:
                  updates.status === "finished"
                    ? Date.now()
                    : item.finishedAt,
              }
              : item,
          ),
        },
      }));
    },

    deleteItem: (subject, id) => {
      set((state) => ({
        items: {
          ...state.items,
          [subject]: (state.items[subject] || []).filter(
            (item) => item.id !== id,
          ),
        },
      }));
    },

    getItems: (subject) => {
      return get().items[subject] || [];
    },

    getFinishedCount: (subject) => {
      return (get().items[subject] || []).filter(
        (i) => i.status === "finished",
      ).length;
    },

    importItems: (subject, newItems) => {
      set((state) => {
        const existing = state.items[subject] || [];
        const existingIds = new Set(existing.map((i) => i.id));
        const toAdd = newItems.filter((i) => !existingIds.has(i.id));

        return {
          items: {
            ...state.items,
            [subject]: [...existing, ...toAdd],
          },
        };
      });
    },
  }),
  { name: "literature" }
);
