import { createStore } from "@shared/lib/storeFactory";

interface BioSkill {
  codonTranslation: number; // 0-100: How well do they understand DNA -> RNA -> Protein
  structuralInsight: number; // 0-100: Do they check the 3D structure?
  mutationImpact: number; // 0-100: Understanding of Silent vs Missense vs Nonsense
}

interface BioMasteryState {
  skills: BioSkill;
  completedMissions: string[];
  registerMutationAttempt: (
    actualType: "Silent" | "Missense" | "Nonsense",
    targetType: "Silent" | "Missense" | "Nonsense" | null,
    viewMode: "pdb" | "procedural",
  ) => void;
  unlockMission: (id: string) => void;
}

export const useBioMasteryStore = createStore<BioMasteryState>(
  (set) => ({
    skills: {
      codonTranslation: 20,
      structuralInsight: 10,
      mutationImpact: 10,
    },
    completedMissions: [],

    unlockMission: (id) =>
      set((state) => ({
        completedMissions: [...state.completedMissions, id],
      })),

    registerMutationAttempt: (actualType, targetType, viewMode) =>
      set((state) => {
        const newSkills = { ...state.skills };

        // 1. Mutation Impact Logic
        if (targetType) {
          if (actualType === targetType) {
            newSkills.mutationImpact = Math.min(
              100,
              newSkills.mutationImpact + 5,
            );
            newSkills.codonTranslation = Math.min(
              100,
              newSkills.codonTranslation + 2,
            );
          } else {
            // Check if they at least got the codon logic right but maybe just missed the specific amino acid target
            newSkills.mutationImpact = Math.max(
              0,
              newSkills.mutationImpact - 2,
            );
          }
        } else {
          // Free play exploration increments slowly
          newSkills.mutationImpact = Math.min(
            100,
            newSkills.mutationImpact + 0.5,
          );
        }

        // 2. Structural Insight
        if (viewMode === "pdb") {
          newSkills.structuralInsight = Math.min(
            100,
            newSkills.structuralInsight + 1,
          );
        } else {
          // If they are mutating blindly without looking at the structure
          // newSkills.structuralInsight = Math.max(0, newSkills.structuralInsight - 0.1);
        }

        return { skills: newSkills };
      }),
  }),
  { name: "bio-mastery" },
);
