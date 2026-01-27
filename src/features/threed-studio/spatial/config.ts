import { Difficulty, LevelConfig, MatrixLevel } from "../types";

export const LEVEL_MATRIX: Record<MatrixLevel, LevelConfig> = {
  1: {
    blocks: 5,
    complexity: 1,
    timeLimit: 30,
    points: 100,
    maxHints: 3,
    label: "studio_3d.build.levels.intro",
    color: "#4ade80",
  },
  2: {
    blocks: 7,
    complexity: 2,
    timeLimit: 20,
    points: 250,
    maxHints: 3,
    label: "studio_3d.build.levels.basic_skill",
    color: "#fbbf24",
  },
  3: {
    blocks: 9,
    complexity: 2,
    timeLimit: 15,
    points: 500,
    maxHints: 2,
    label: "studio_3d.build.levels.vwo_basic",
    color: "#38bdf8",
  },
  4: {
    blocks: 12,
    complexity: 3,
    timeLimit: 10,
    points: 1000,
    maxHints: 2,
    label: "studio_3d.build.levels.expert",
    color: "#f472b6",
  },
  5: {
    blocks: 15,
    complexity: 4,
    timeLimit: 6,
    points: 2500,
    maxHints: 1,
    label: "studio_3d.build.levels.elite",
    color: "#a855f7",
  },
};

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { startLevel: MatrixLevel; label: string; color: string }
> = {
  easy: {
    startLevel: 1,
    label: "studio_3d.build.difficulty_labels.easy",
    color: "#4ade80",
  },
  medium: {
    startLevel: 2,
    label: "studio_3d.build.difficulty_labels.medium",
    color: "#fbbf24",
  },
  hard: {
    startLevel: 3,
    label: "studio_3d.build.difficulty_labels.hard",
    color: "#ef4444",
  },
  elite: {
    startLevel: 4,
    label: "studio_3d.build.difficulty_labels.elite",
    color: "#a855f7",
  },
};

export const OPTION_COLORS = ["#6366f1", "#10b981", "#0ea5e9", "#f43f5e"];
export const MAX_ROUNDS = 10;
