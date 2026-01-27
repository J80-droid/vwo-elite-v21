import { createStore } from "@shared/lib/storeFactory";
import { PWSPhase, PWSProject } from "@shared/types";

interface PWSState {
  project: PWSProject | null;
  setProject: (project: PWSProject) => void;
  updatePhase: (phase: PWSPhase) => void;
  updateProgress: (checklistProgress: Record<string, boolean>) => void;
  addCitation: (citation: string) => void;
  removeCitation: (index: number) => void;
  addHypothesis: (data: {
    claim: string;
    counter: string;
    arguments: string;
    formula: string;
  }) => void;
}

export const usePWSStore = createStore<PWSState>(
  (set) => ({
    project: null,
    setProject: (project) => set({ project }),

    updatePhase: (phase) =>
      set((state) => ({
        project: state.project
          ? {
            ...state.project,
            currentPhase: phase,
            updatedAt: Date.now(),
          }
          : null,
      })),

    updateProgress: (checklistProgress) =>
      set((state) => ({
        project: state.project
          ? {
            ...state.project,
            checklistProgress,
            updatedAt: Date.now(),
          }
          : null,
      })),

    addCitation: (citation: string) =>
      set((state) => {
        if (!state.project) return {};
        return {
          project: {
            ...state.project,
            citations: [...(state.project?.citations || []), citation],
            updatedAt: Date.now(),
          },
        };
      }),

    removeCitation: (index: number) =>
      set((state) => {
        if (!state.project) return {};
        const newCitations = [...(state.project.citations || [])];
        newCitations.splice(index, 1);
        return {
          project: {
            ...state.project,
            citations: newCitations,
            updatedAt: Date.now(),
          },
        };
      }),

    addHypothesis: (data) =>
      set((state) => {
        if (!state.project) return {};
        const newHypothesis = {
          id: Math.random().toString(36).substr(2, 9),
          ...data,
          createdAt: Date.now(),
        };
        return {
          project: {
            ...state.project,
            hypotheses: [...(state.project?.hypotheses || []), newHypothesis],
            updatedAt: Date.now(),
          },
        };
      }),
  }),
  { name: "pws" }
);
