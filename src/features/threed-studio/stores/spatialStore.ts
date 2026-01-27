import { logActivitySQL } from "@shared/api/sqliteService";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CrossSectionAttempt {
  id: string;
  date: number;
  levelId: number;
  shape: string;
  sliceType: string;
  correct: boolean;
  answerGiven: string;
  timeTaken: number;
}

export interface SessionData {
  difficulty: string;
  timeTaken: number;
  mistakes: number;
  hintsUsed: number;
  score: number;
  date?: number;
}

export interface SlicerAttempt {
  id: string;
  date: number;
  shapeType: string;
  targetShape: string;
  achievedShape: string;
  correct: boolean;
  timeTaken: number;
  rotations: { x: number; y: number };
}

interface SpatialState {
  attempts: CrossSectionAttempt[];
  sessions: SessionData[];
  slicerAttempts: SlicerAttempt[];

  // Actions
  logAttempt: (attempt: Omit<CrossSectionAttempt, "id" | "date">) => void;
  logSession: (session: SessionData) => void;
  logSlicerAttempt: (attempt: Omit<SlicerAttempt, "id" | "date">) => void;
  getWeaknesses: () => string[]; // Geeft types terug waar vaak fouten in worden gemaakt
  getSlicerWeaknesses: () => string[];
}

export const useSpatialStore = create<SpatialState>()(
  persist(
    (set, get) => ({
      attempts: [],
      sessions: [],
      slicerAttempts: [],

      logSlicerAttempt: (data) => {
        // 1. Log naar database voor dashboard
        if (data.correct) {
          logActivitySQL(
            "spatial",
            `Slicer ${data.shapeType} -> ${data.targetShape} voltooid`,
            15,
          );
        }

        set((state) => ({
          slicerAttempts: [
            { ...data, id: crypto.randomUUID(), date: Date.now() },
            ...state.slicerAttempts,
          ],
        }));
      },

      getSlicerWeaknesses: () => {
        const { slicerAttempts } = get();
        const mistakes = slicerAttempts.filter((a) => !a.correct);
        // Analyseer welke shapes het vaakst fout gaan
        const counts: Record<string, number> = {};
        mistakes.forEach((m) => {
          counts[m.shapeType] = (counts[m.shapeType] || 0) + 1;
        });
        return Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .map(([k]) => k);
      },

      logAttempt: (data) => {
        // 1. Log naar centrale database voor dashboard
        if (data.correct) {
          logActivitySQL("spatial", `Doorsnede ${data.shape} correct`, 25);
        }

        // 2. Sla op in lokale historie
        set((state) => ({
          attempts: [
            { ...data, id: crypto.randomUUID(), date: Date.now() },
            ...state.attempts,
          ],
        }));
      },

      logSession: (data) => {
        logActivitySQL(
          "spatial",
          `Bouw sessie voltooid (${data.difficulty})`,
          data.score,
        );
        set((state) => ({
          sessions: [{ ...data, date: Date.now() }, ...state.sessions],
        }));
      },

      getWeaknesses: () => {
        const { attempts } = get();
        const mistakes = attempts.filter((a) => !a.correct);
        if (mistakes.length < 3) return []; // Pas analyseren bij voldoende data

        const counts: Record<string, number> = {};
        mistakes.forEach((m) => {
          counts[m.sliceType] = (counts[m.sliceType] || 0) + 1;
          counts[m.shape] = (counts[m.shape] || 0) + 1;
        });

        // Sorteer op meest gemaakte fouten
        return Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .map(([key]) => key);
      },
    }),
    { name: "spatial-training-storage" },
  ),
);
