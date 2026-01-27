import { createStore } from "@shared/lib/storeFactory";

interface LibraryState {
  subjectOrder: string[]; // List of IDs in order
  setSubjectOrder: (order: string[]) => void;
}

export const useLibraryStore = createStore<
  LibraryState,
  { subjectOrder: string[] }
>(
  (set) => ({
    subjectOrder: [], // Default empty, will fallback to initialSubjects in UI
    setSubjectOrder: (order) => set({ subjectOrder: order }),
  }),
  {
    name: "library-layout",
    persistOptions: {
      partialize: (state) => ({ subjectOrder: state.subjectOrder }),
    },
  }
);
