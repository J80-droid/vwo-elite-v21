import { createStore } from "@shared/lib/storeFactory";
import {
    EnvironmentType,
    ReactantDef,
    ReactionDef,
} from "./ChemistryTypes";
import { analyzeReaction } from "./ReactionData";

interface ReactionState {
    selected: ReactantDef[];
    result: ReactionDef | null;
    environment: EnvironmentType;
    categoryFilter: string;
    search: string;
    setSelected: (selected: ReactantDef[] | ((prev: ReactantDef[]) => ReactantDef[])) => void;
    setResult: (result: ReactionDef | null) => void;
    setEnvironment: (environment: EnvironmentType) => void;
    setCategoryFilter: (filter: string) => void;
    setSearch: (search: string) => void;
    reset: () => void;
    mix: (t: (key: string, def?: string) => string) => void;
}

export const useReactionStore = createStore<ReactionState>(
    (set, get) => ({
        selected: [],
        result: null,
        environment: "neutral",
        categoryFilter: "all",
        search: "",

        setSelected: (val) => {
            if (typeof val === "function") {
                set((state) => ({ selected: val(state.selected) }));
            } else {
                set({ selected: val });
            }
        },
        setResult: (result) => set({ result }),
        setEnvironment: (environment) => set({ environment }),
        setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
        setSearch: (search) => set({ search }),

        reset: () => set({ selected: [], result: null }),

        mix: (t) => {
            const { selected, environment } = get();
            if (selected.length !== 2) return;

            set({ result: null });

            // Engine Call
            const outcome = analyzeReaction(
                selected.map((r) => r.id),
                environment,
            );

            if (outcome) {
                set({ result: outcome });
            } else {
                // Fallback: Physical Mix
                const r1 = selected[0]!;
                const r2 = selected[1]!;
                set({
                    result: {
                        reactants: [r1.id, r2.id],
                        products: t("chemistry.simulation.physical_mixture", "Mengsel"),
                        observation: t("chemistry.simulation.no_reaction", "Geen waarneembare reactie."),
                        type: "Menging",
                        equation: `${r1.formula} + ${r2.formula} → (mix)`,
                        visualMix: true,
                        resultColor: "bg-white/5",
                    },
                });
            }
        },
    }),
    { name: "reaction-lab" }
);
