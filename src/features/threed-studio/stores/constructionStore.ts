import { logActivitySQL } from "@shared/api/sqliteService";
import { Vec3 } from "@shared/lib/voxelUtils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Re-export Vec3 for consumers

export interface BuildSession {
  id: string;
  date: number;
  mode: "ghost" | "projection" | "creative";
  timeTaken: number; // seconds
  mistakes: number; // extra + missing blocks
  score: number;
}

export interface SavedCreation {
  id: string;
  name: string;
  voxels: Vec3[];
  date: number;
}

interface ConstructionState {
  sessions: BuildSession[];
  savedCreations: SavedCreation[];

  // Actions
  logSession: (session: Omit<BuildSession, "id" | "date">) => void;
  saveCreation: (name: string, voxels: Vec3[]) => void;
  loadCreationVoxels: (id: string) => Vec3[] | null;
  deleteCreation: (id: string) => void;
  getStats: () => { totalSessions: number; avgScore: number; bestMode: string };
}

export const useConstructionStore = create<ConstructionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      savedCreations: [],

      logSession: (data) => {
        // Log to database for dashboard
        logActivitySQL(
          "spatial",
          `Bouwopdracht (${data.mode}) - Score: ${data.score}`,
          data.score,
        );

        // Save in local history
        set((state) => ({
          sessions: [
            { ...data, id: crypto.randomUUID(), date: Date.now() },
            ...state.sessions.slice(0, 49), // Keep last 50
          ],
        }));
      },

      saveCreation: (name, voxels) =>
        set((state) => ({
          savedCreations: [
            { id: crypto.randomUUID(), name, voxels, date: Date.now() },
            ...state.savedCreations,
          ],
        })),

      loadCreationVoxels: (id) => {
        const creation = get().savedCreations.find((c) => c.id === id);
        return creation ? creation.voxels : null;
      },

      deleteCreation: (id) =>
        set((state) => ({
          savedCreations: state.savedCreations.filter((c) => c.id !== id),
        })),

      getStats: () => {
        const sessions = get().sessions;
        if (sessions.length === 0) {
          return { totalSessions: 0, avgScore: 0, bestMode: "none" };
        }

        const avgScore = Math.round(
          sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length,
        );

        // Find mode with highest average score
        const modeScores: Record<string, number[]> = {};
        sessions.forEach((s) => {
          if (!modeScores[s.mode]) modeScores[s.mode] = [];
          modeScores[s.mode]!.push(s.score);
        });

        let bestMode = "ghost";
        let bestAvg = 0;
        Object.entries(modeScores).forEach(([mode, scores]) => {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avg > bestAvg) {
            bestAvg = avg;
            bestMode = mode;
          }
        });

        return { totalSessions: sessions.length, avgScore, bestMode };
      },
    }),
    { name: "vwo-elite-construction" },
  ),
);
