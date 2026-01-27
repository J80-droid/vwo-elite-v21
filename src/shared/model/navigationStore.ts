import { createStore } from "@shared/lib/storeFactory";
import { Language } from "@shared/types";

interface NavigationState {
  language: Language;
  setLanguage: (lang: Language) => void;

  // UI State
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useNavigationStore = createStore<
  NavigationState,
  { language: Language }
>(
  (set) => ({
    language: "nl",
    setLanguage: (language) => set({ language }),

    // UI State
    sidebarOpen: false,
    mobileMenuOpen: false,
    toggleSidebar: () =>
      set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    toggleMobileMenu: () =>
      set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    closeMobileMenu: () => set({ mobileMenuOpen: false }),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
  }),
  {
    name: "navigation",
    persistOptions: {
      partialize: (state) => ({
        language: state.language,
        // sidebarOpen removed from persistence to always start collapsed
      }),
    },
  }
);
