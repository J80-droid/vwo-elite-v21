import { ExamIndexEntry } from "@shared/types/dashboard";

/**
 * Valid module identifiers for the Exam Center.
 */
export type ExamModule =
  | "simulator"
  | "quiz"
  | "trainer"
  | "dashboard"
  | "results";

/**
 * Severity levels for console logging.
 */
export type LogLevel = "info" | "success" | "warning" | "error";

/**
 * A single entry in the system console.
 */
export interface LogEntry {
  id: string; // UUID for React keys
  timestamp: number; // Unix timestamp
  level: LogLevel;
  message: string;
  source?: string; // Component or service that sent the log
}

/**
 * State specific to the Simulator module.
 */
export interface SimulatorData {
  // New elite fields
  scenarioId?: string;
  stepIndex: number;
  variables: Record<string, number>;
  logs: LogEntry[];
  code: string;

  // Existing fields (legacy compatibility)
  exams?: ExamIndexEntry[];
  selectedSubject?: string;
  selectedExam?: ExamIndexEntry | null;
  simState?:
    | "idle"
    | "answering"
    | "self_review"
    | "grading"
    | "results"
    | "error";
  errorMessage?: string;
  questionLabel?: string;
  studentAnswer?: string;
  selfScore?: number;
  aiResult?: { score: number; feedback: string; topics: string[] } | null;
}

/**
 * State specific to the Quiz module.
 */
export interface QuizData {
  currentQuestionId?: string;
  answers?: Record<string, string>;
  score?: number;
  isComplete?: boolean;
  // Allow for module-specific state extensions
  [key: string]: unknown;
}

/**
 * State specific to the Trainer module.
 */
export interface TrainerData {
  topicId?: string;
  progress: number;
}

/**
 * Unified data registry for all exam modules.
 */
export interface ExamSessionData {
  simulator: SimulatorData;
  quiz?: QuizData; // Removed any, using QuizData
  trainer: TrainerData;
  dashboard: Record<string, never>;
}

/**
 * The core state of the Exam Context.
 */
export interface ExamContextState {
  activeModule: ExamModule;
  isConsoleOpen: boolean;
  consoleHeight: number;
  activeExam: ExamIndexEntry | null;
  examData: Partial<ExamSessionData>;
}

/**
 * Actions available via the Exam Context.
 */
export interface ExamContextActions {
  setActiveModule: (module: ExamModule) => void;
  setIsConsoleOpen: (isOpen: boolean) => void;
  setConsoleHeight: (height: number) => void;
  setActiveExam: (exam: ExamIndexEntry | null) => void;

  /**
   * Update data for a specific module in a type-safe way.
   */
  updateExamData: <K extends keyof ExamSessionData>(
    module: K,
    data: Partial<ExamSessionData[K]>,
  ) => void;
}

/**
 * Complete Exam Context type.
 */
export type ExamContextType = ExamContextState & ExamContextActions;
