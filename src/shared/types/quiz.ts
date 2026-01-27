import { Subject } from "./common";

// --- QUIZ / TESTLAB TYPES ---

export interface Question {
  id: string;
  text: string;
  question?: string; // Standardize for some services
  type:
  | "multiple-choice"
  | "multiple_choice"
  | "open"
  | "open-question"
  | "open_question"
  | "true-false"
  | "true_false"
  | "error_spotting"
  | "error-spotting"
  | "source-analysis"
  | "source_analysis"
  | "ordering"
  | "fill-blank"
  | "fill_blank";
  options?: string[];
  correctAnswer?: string | number;
  correctIndex?: number; // Used in TestLab
  correctAnswerIndex?: number; // Used in LessonContent
  explanation?: string;
  hint?: string;
  solutionSteps?: string[];
  contextReference?: string;
  final_answer_latex?: string;
  feedback?: Record<string, string>; // Option text -> specific feedback
  modelAnswer?: string; // Used in open questions
  context?: string; // Used in error spotting
  steps?: { id: string; text: string; correction?: string }[]; // Used in error spotting
  items?: { id: string; text: string }[]; // Used in ordering
  correctSequence?: string[]; // Used in ordering (IDs)
  blanks?: { index: number; answer: string; options?: string[] }[]; // Used in fill-blank
  sourceTitle?: string; // Used in source analysis
  sourceText?: string; // Used in source analysis
  rubric?: string; // Used in open questions
  maxScore?: number; // Used in open questions
  subject: Subject | string;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
  tags?: string[];
}

export type QuizQuestion = Question; // Alias for compatibility
export type OpenQuestionItem = Question; // Alias for compatibility
export type TestLabQuestion = Question; // Alias for compatibility
export type MultipleChoiceQuestion = Question; // Alias for compatibility
export type ErrorSpottingQuestion = Question; // Alias for compatibility
export type OrderingQuestion = Question; // Alias for compatibility
export type SourceAnalysisQuestion = Question; // Alias for compatibility
export type QuizQuestionType = Question["type"];

export interface QuizResult {
  id: string;
  quizId?: string;
  date: number; // timestamp
  score: number;
  totalQuestions: number;
  correctCount: number;
  subject: Subject;
  topic?: string;
  timeSpent: number; // seconds
  answers?: Record<string, string>; // questionId -> answer
  breakdown?: Record<string, { correct: number; total: number }>;
  questions?: Question[];
  mode?: "study" | "exam";
}

export interface QuizSession {
  id: string;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  startTime: number;
  isFinished: boolean;
  subject: Subject;
  config?:
  | {
    mode: "practice" | "exam";
    timeLimit?: number | undefined;
  }
  | undefined;
}

export interface QuizAnswerResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  timeSpent: number;
}

export interface QuizProgressStats {
  totalQuizzes: number;
  averageScore: number;
  topicScores: Record<string, { correct: number; total: number }>;
  typeScores: Record<string, { correct: number; total: number }>;
  weakestTopics: string[];
  strongestTopics: string[];
}

export interface SavedQuestion {
  id: string;
  question: Question;
  savedAt: number;
}

export interface QuizStrategy {
  topic: string;
  blockedTypes: string[];
  expiry: number;
}

export type SkillMatrix = Record<
  string,
  { level: number; xp: number; mastery: number }
>;

export interface LanguageFeedback {
  grammarScore: number;
  vocabularyScore: number;
  pronunciationScore: number;
  grammarFeedback: string;
  vocabularyFeedback: string;
  generalTips: string;
}

export interface IdiomExercise {
  targetWord: string;
  sentence: string;
  options: string[];
  correctAnswer: string;
  translation: string;
  feedback: Record<string, string>;
}

export interface Scenario {
  id: string;
  text: string;
  context: string;
  options: {
    id: string;
    text: string;
    competencies: Record<string, number>;
    feedback: string;
  }[];
}

export interface LanguageScenario {
  title: string;
  description: string;
  level: string;
  systemInstruction: string;
  targetVocabulary?: string[];
}

export interface QuizResponse {
  questions: Question[];
}
