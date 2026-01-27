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
  meta?: Record<string, unknown>; // Auxiliary metadata for internal tracking (e.g. sourceEngineId)
}

export interface GymEngine {
  id: string;
  name: string;
  description: string;
  generate: (level: Difficulty) => GymProblem;
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
