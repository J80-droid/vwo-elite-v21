// Gym types shared between physics and math features

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface GymProblem {
  id: string;
  question: string; // LaTeX string for display (e.g. "\frac{1}{x} + \frac{1}{y}")
  answer: string; // Expected answer (standardized for validation)
  displayAnswer?: string; // LaTeX version of the answer for display
  alternatives?: string[]; // Other correct formats
  context?: string; // E.g. "Maak gelijknamig"
  misconceptions?: Record<string, string>; // Map of wrong answer -> specific feedback
  solutionSteps?: string[]; // Step-by-step explanation (can contain LaTeX)
  imageUrl?: string; // Optionele afbeelding voor visuele context
  acceptedAnswers?: string[]; // Synoniemen voor validatie voor open vragen
  meta?: Record<string, unknown>; // Auxiliary metadata for internal tracking (e.g. sourceEngineId)
  explanation?: string; // Textual explanation of the correct answer
  stepSolverResult?: StepSolverResult; // Result from Math StepSolver
  type?: "text" | "multiple-choice" | "reorder"; // UI variants
  options?: string[]; // Choice options for multiple-choice/reorder
}

export interface StepSolverResult {
  problem: string;
  type: "derivative" | "integral" | "definite_integral" | "roots" | "simplify" | "factor" | "limit" | "spot_error" | "exam_trainer";
  steps: {
    id: string;
    title: string;
    description: string;
    latex: string;
    rule?: string;
    rationale?: string;
  }[];
  finalAnswer: string;
  primaryColor?: string;
  isErrorSpotting?: boolean;
  errorStepId?: string;
  nextProblem?: string;
}

export interface GymEngine {
  id: string;
  name: string;
  description: string;
  symbols?: string[];
  generate: (level: Difficulty) => GymProblem | Promise<GymProblem>;
  validate: (
    input: string,
    problem: GymProblem,
  ) => { correct: boolean; feedback?: string };
}

export interface UserProgress {
  userId: string;
  xp: number;
  level: number;
  streak: number;
  solvedProblems: string[];
  stats: Record<string, number>; // engineId -> count
}

export interface TrajectoryPoint {
  month: string;
  grade: number;
  projected?: number;
}

export interface GymResultMetrics {
  question: string;
  answer: string;
  input: string;
  context?: string;
  confidence?: "low" | "medium" | "high";
  hintsUsed?: number;
  timeToAnswer?: number; // In seconds
  isSkipped?: boolean; // For exam simulation analysis
  [key: string]: unknown;
}
