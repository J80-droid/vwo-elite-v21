import { createStore } from "@shared/lib/storeFactory";
import {
  Question,
  QuizAnswerResult,
  QuizProgressStats,
  QuizResult,
  QuizSession,
  QuizStrategy,
  SavedQuestion,
  SkillMatrix,
} from "@shared/types";

import { useUserStatsStore } from "./userStatsStore";

interface QuizProgressState {
  // State
  history: QuizResult[];
  stats: QuizProgressStats;
  savedQuestions: SavedQuestion[];
  skillMatrix: SkillMatrix;
  activeStrategy: QuizStrategy;

  // Actions
  setInitialState: (data: Partial<QuizProgressState>) => void;
  addQuizResult: (session: QuizSession, results: QuizAnswerResult[]) => void;

  saveQuestion: (question: Question) => void;
  removeQuestion: (id: string) => void;

  clearHistory: () => void;
  updateSkillsFromResults: (
    results: QuizAnswerResult[],
    questions: Question[],
  ) => void;
}

const initialStats: QuizProgressStats = {
  totalQuizzes: 0,
  averageScore: 0,
  topicScores: {},
  typeScores: {},
  weakestTopics: [],
  strongestTopics: [],
};

const initialSkillMatrix: SkillMatrix = {
  algemeen: { level: 1, xp: 0, mastery: 50 }, // Default fallback
};

export const useQuizProgressStore = createStore<QuizProgressState>(
  (set, get) => ({
    history: [],
    stats: initialStats,
    savedQuestions: [],
    skillMatrix: initialSkillMatrix,
    activeStrategy: {
      topic: "",
      blockedTypes: [],
      expiry: 0,
    },

    setInitialState: (data) => set((state) => ({ ...state, ...data })),

    addQuizResult: (session, results) => {
      const { history, stats } = get();

      const correctCount = results.filter((r) => r.isCorrect).length;
      const total = session.questions.length;

      // Calculate breakdown
      const breakdown: Record<string, { correct: number; total: number }> =
        {};
      results.forEach((r, i) => {
        const type = session.questions[i]!.type;
        if (!breakdown[type]) breakdown[type] = { correct: 0, total: 0 };
        breakdown[type]!.total++;
        if (r.isCorrect) breakdown[type]!.correct++;
      });

      const result: QuizResult = {
        id: session.id,
        date: Date.now(),
        score: correctCount,
        totalQuestions: total,
        correctCount,
        subject: session.subject,
        topic: session.config?.mode === "exam" ? "Exam" : "Practice",
        timeSpent: results.reduce((acc, r) => acc + r.timeSpent, 0),
        answers: session.answers,
        questions: session.questions,
        breakdown,
      };

      const newHistory = [result, ...history].slice(0, 50);

      // --- Simple Stat Update Logic (Can be expanded) ---
      const newTotalQuizzes = stats.totalQuizzes + 1;
      // Recalc average
      const newAvg = Math.round(
        newHistory.reduce(
          (acc, h) => acc + (h.score / h.totalQuestions) * 100,
          0,
        ) / newHistory.length,
      );

      set({
        history: newHistory,
        stats: {
          ...stats,
          totalQuizzes: newTotalQuizzes,
          averageScore: newAvg,
        },
      });

      get().updateSkillsFromResults(results, session.questions);

      // --- Achievement Check ---
      if (correctCount === total && total > 0) {
        useUserStatsStore.getState().recordPerfectQuiz();
      }
    },

    updateSkillsFromResults: (results, questions) => {
      set((state) => {
        const newMatrix = { ...state.skillMatrix };

        results.forEach((r, i) => {
          const q = questions[i]!;
          // Map Subject to SkillMatrix with proper XP and level progression
          const subject = q.subject || "algemeen";

          if (!newMatrix[subject]) {
            newMatrix[subject] = { level: 1, xp: 0, mastery: 50 };
          }

          const skill = newMatrix[subject]!;

          // XP and mastery impact based on correctness
          if (r.isCorrect) {
            // Correct: gain XP and mastery
            skill.xp += 10;
            skill.mastery = Math.min(100, skill.mastery + 3);

            // Level up check (100 XP per level)
            if (skill.xp >= skill.level * 100) {
              skill.level += 1;
              skill.xp = 0; // Reset XP for next level
            }
          } else {
            // Incorrect: lose some mastery, no XP loss
            skill.mastery = Math.max(0, skill.mastery - 2);
          }

          newMatrix[subject] = skill;
        });

        return { skillMatrix: newMatrix };
      });
    },

    saveQuestion: (question) => {
      set((state) => {
        if (state.savedQuestions.some((sq) => sq.id === question.id))
          return {};
        return {
          savedQuestions: [
            { id: question.id, question, savedAt: Date.now() },
            ...state.savedQuestions,
          ],
        };
      });
    },

    removeQuestion: (id) => {
      set((state) => ({
        savedQuestions: state.savedQuestions.filter((q) => q.id !== id),
      }));
    },

    clearHistory: () =>
      set({
        history: [],
        stats: initialStats,
        savedQuestions: [],
        activeStrategy: { topic: "", blockedTypes: [], expiry: 0 },
      }),
  }),
  { name: "quiz-progress" }
);
