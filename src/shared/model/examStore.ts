import { logActivitySQL } from "@shared/api/sqliteService";
import { createStore } from "@shared/lib/storeFactory";

export interface ExamAttempt {
  id: string;
  date: number;
  subject: string;
  year: string;
  questionLabel: string;
  studentAnswer: string;
  aiFeedback: string; // De "Rode Pen" HTML string
  score: number; // AI Score (0-100)
  selfScore: number; // NIEUW: Wat de leerling zelf dacht (0-100)
  topics: string[]; // NIEUW: Bijv. ["Mechanica", "Arbeid"]
  calibrationGap: number; // NIEUW: Verschil tussen selfScore en score
}

interface ExamState {
  attempts: ExamAttempt[];
  logExamAttempt: (
    attempt: Omit<ExamAttempt, "id" | "date" | "calibrationGap">,
  ) => void;
  getAverageScoreBySubject: (subject: string) => number;
}

export const useExamStore = createStore<ExamState>(
  (set, get) => ({
    attempts: [],

    logExamAttempt: (data) => {
      // Bereken hoe goed de leerling zijn eigen kunnen inschat
      const gap = data.score - data.selfScore; // Positief = leerling was te streng, Negatief = leerling overschat zichzelf

      logActivitySQL(
        "exam",
        `Vraag ${data.questionLabel} voltooid`,
        data.score,
      );

      set((state) => ({
        attempts: [
          {
            ...data,
            id: crypto.randomUUID(),
            date: Date.now(),
            calibrationGap: gap,
          },
          ...state.attempts,
        ],
      }));
    },

    getAverageScoreBySubject: (subject) => {
      const relevant = get().attempts.filter((a) => a.subject === subject);
      if (!relevant.length) return 0;
      return Math.round(
        relevant.reduce((acc, curr) => acc + curr.score, 0) / relevant.length,
      );
    },
  }),
  { name: "exam-portfolio" }
);
