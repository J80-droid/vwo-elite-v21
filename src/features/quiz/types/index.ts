import { StudyMaterial } from "@shared/types/study";

// --- QUIZ / TESTLAB TYPES ---
export type { StudyMaterial };
export type QuizInputSource = "curriculum" | "upload" | "chat" | "library";

import {
  QuizAnswerResult,
  QuizQuestion,
  QuizSession,
  TestLabQuestion,
} from "@shared/types/quiz";

export type { QuizAnswerResult, QuizQuestion, QuizSession, TestLabQuestion };
