import { logActivitySQL } from "@shared/api/sqliteService";
import { createStore } from "@shared/lib/storeFactory";

export interface ExperimentLog {
  id: string;
  date: number;
  type: "titration" | "reaction";
  title: string;
  details: string; // Bijv: "0.1M HCl met 0.1M NaOH"
  dataPoints: { x: number; y: number }[]; // Voor de grafiek historie
  score: number; // 0-10 nauwkeurigheid
  accuracy: number; // % afwijking
}

interface ChemState {
  logs: ExperimentLog[];
  addLog: (log: Omit<ExperimentLog, "id" | "date">) => void;
  getLogsByType: (type: "titration" | "reaction") => ExperimentLog[];
}

export const useChemStore = createStore<ChemState>(
  (set, get) => ({
    logs: [],

    addLog: (entry) => {
      const newLog = {
        ...entry,
        id: crypto.randomUUID(),
        date: Date.now(),
      };

      // Log ook direct naar de centrale SQLite database voor het dashboard
      logActivitySQL(
        "chem",
        `Experiment afgerond: ${entry.title}`,
        Math.round(entry.score * 5), // XP op basis van score
      );

      set((state) => ({
        logs: [newLog, ...state.logs],
      }));
    },

    getLogsByType: (type) => get().logs.filter((l) => l.type === type),
  }),
  { name: "chem-lab" }
);
