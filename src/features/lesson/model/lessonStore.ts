import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LessonStoreState {
    // Selection & Ordering
    selectedMaterials: Set<string>;
    manualOrder: string[];
    searchQuery: string;

    // Actions
    toggleSelection: (id: string) => void;
    setSelectedMaterials: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
    setManualOrder: (order: string[] | ((prev: string[]) => string[])) => void;
    setSearchQuery: (query: string) => void;
    reset: () => void;
}

// Custom storage for Set serialization
const storageOptions = {
    name: 'vwo-elite-lesson-store',
    storage: {
        getItem: (name: string) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const existing = JSON.parse(str);
            return {
                ...existing,
                state: {
                    ...existing.state,
                    selectedMaterials: new Set(existing.state.selectedMaterials),
                },
            };
        },
        setItem: (name: string, value: { state: LessonStoreState }) => {
            const serialized = {
                ...value,
                state: {
                    ...value.state,
                    selectedMaterials: Array.from(value.state.selectedMaterials),
                },
            };
            localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name: string) => localStorage.removeItem(name),
    },
};

export const useLessonStore = create<LessonStoreState>()(
    persist(
        (set) => ({
            selectedMaterials: new Set(),
            manualOrder: [],
            searchQuery: "",

            toggleSelection: (id) =>
                set((state) => {
                    const next = new Set(state.selectedMaterials);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return { selectedMaterials: next };
                }),

            setSelectedMaterials: (updater) =>
                set((state) => {
                    const next = typeof updater === 'function' ? updater(state.selectedMaterials) : updater;
                    return { selectedMaterials: next };
                }),

            setManualOrder: (updater) =>
                set((state) => {
                    const next = typeof updater === 'function' ? updater(state.manualOrder) : updater;
                    return { manualOrder: next };
                }),

            setSearchQuery: (query) => set({ searchQuery: query }),

            reset: () => set({ selectedMaterials: new Set(), manualOrder: [], searchQuery: "" }),
        }),
        storageOptions
    )
);
