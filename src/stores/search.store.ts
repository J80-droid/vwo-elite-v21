import { DocSearchResult } from "@vwo/shared-types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

const getVwoApi = () => window.vwoApi;

interface SearchState {
  query: string;
  searchResults: DocSearchResult[];
  isSearching: boolean;
  searchError: string | null;
  search: (query: string) => Promise<void>;
  reset: () => void;
}

export const useSearchStore = create<SearchState>()(
  devtools(
    persist(
      (set, _get) => {
        // Houd de abort controller buiten de state om re-renders te voorkomen,
        // maar binnen de closure van de store.
        let abortController: AbortController | null = null;

        return {
          query: "",
          searchResults: [],
          isSearching: false,
          searchError: null,

          search: async (query: string) => {
            // 1. Update UI direct
            set({ query, isSearching: true, searchError: null });

            // 2. Annuleer vorige lopende request (RACE CONDITION FIX)
            if (abortController) {
              abortController.abort();
            }

            // 3. Maak nieuwe controller voor deze specifieke request
            abortController = new AbortController();
            const signal = abortController.signal;

            try {
              if (!query.trim()) {
                set({ searchResults: [], isSearching: false });
                return;
              }

              // 4. Voer zoekopdracht uit (via IPC)
              const vwoApi = getVwoApi();
              if (!vwoApi) throw new Error("VWO API not available");
              const results = await vwoApi.documents.search(query);

              // 5. Check of we geaborted zijn in de tussentijd
              if (signal.aborted) return;

              set({ searchResults: results, isSearching: false });
            } catch (error) {
              if (signal.aborted) return;

              console.error("Search failed:", error);
              set({
                searchError: "Er ging iets mis bij het zoeken.",
                isSearching: false,
                searchResults: [],
              });
            }
          },

          reset: () => {
            if (abortController) abortController.abort();
            set({
              query: "",
              searchResults: [],
              isSearching: false,
              searchError: null,
            });
          },
        };
      },
      {
        name: "search-storage",
        partialize: (state) => ({
          searchResults: state.searchResults,
          query: state.query,
        }), // Only persist results and query
      },
    ),
  ),
);
