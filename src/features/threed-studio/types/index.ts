/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideIcon } from "lucide-react";
import React from "react";

// --- Module Configuration ---
export interface ThreeDModuleConfig {
  id: string;
  label: (t: (key: string, defaultValue?: string) => string) => string;
  description: (t: (key: string, defaultValue?: string) => string) => string;
  icon: LucideIcon;
  color: string; // Tailwind color class (e.g., 'cyan', 'text-cyan-400')
  borderColor: string; // Tailwind border class
  // Layout Components
  StageComponent?: React.FC<any>;
  SidebarComponent?: React.FC<any>;
  component?: React.FC<any>; // Legacy fallback
}

// --- Global Lab Settings ---
export interface ThreeDGlobalSettings {
  gridEnabled: boolean;
  axesEnabled: boolean;
  highPerformance: boolean; // GPU Acceleration toggle
}

// --- Module States ---

// Default state for any module that doesn't need specific state yet

// ... (We can add specific states for other modules as we migrate them)

// --- SPATIAL / GAME TYPES ---
export type Vec3 = [number, number, number];
export type MatrixLevel = 1 | 2 | 3 | 4 | 5;
export type Difficulty = "easy" | "medium" | "hard" | "elite";
export type TrainingModule =
  | "rotation"
  | "nets"
  | "counting"
  | "pov"
  | "shadows"
  | "puzzle"
  | "sequence"
  | "spot"
  | "projection"
  | "cross-section"
  | "xray"
  | "folding"
  | "pathfinding"
  | "mechanical"
  | "chirality"
  | "stability";

export interface LevelConfig {
  blocks: number;
  complexity: number;
  timeLimit: number;
  points: number;
  maxHints: number;
  label: string;
  color: string;
}

export interface StructureOption {
  structure: Vec3[];
  rotation?: Vec3;
  tower?: any[]; // Physics blocks for stability module
  unstable?: boolean;
  path?: Vec3[];
  explanation?: string; // Educational feedback explaining why this option is correct/incorrect
  twoDData?: Record<string, any>; // Flexible data for 2D overlays (grids, nets, folding)
  gearDir?: number; // Mechanical module gear direction
}
