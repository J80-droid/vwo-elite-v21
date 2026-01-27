// PhysicsLab Types
// Shared type definitions for PhysicsLab components
import { type TFunction } from "@shared/types/i18n";
export type { TFunction };

// Generic Module ID
export type PhysicsModule = string;

// 1. GLOBAL Settings (Shared across ALL modules)
export interface PhysicsGlobalSettings {
  themeMode: "dark" | "light" | "system";
  simulationSpeed: number;
  timeSpeed: number;
  isPaused: boolean;
  showGrid: boolean;
  showVectors: boolean;
  showForces: boolean;
  activeGraphTool: "none" | "tangent" | "integral";
}

// 2. MODULE-SPECIFIC Settings Interfaces (Examples, extensible)

// Quiz State

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Union for helpers (optional)

export const defaultPhysicsGlobalSettings: PhysicsGlobalSettings = {
  simulationSpeed: 1,
  isPaused: false,
  showGrid: true,
  showVectors: true,
  showForces: true,
  timeSpeed: 1.0,
  themeMode: "system",
  activeGraphTool: "none",
};

// --- CONTEXT TYPES ---

/** Interface for the centralized physics lab state hook */
export interface UsePhysicsLabStateReturn {
  // Module selection
  activeModule: PhysicsModule;
  setActiveModule: (module: PhysicsModule) => void;

  // --- NEW: Modular State Access Helpers ---
  /** Active module's specific state */
  state: Record<string, unknown>;
  /** Helper to update active module's state */
  setParameter: (key: string, value: unknown) => void;
  /** Translation function */
  t: TFunction;

  // UI State
  isConsoleOpen: boolean;
  setConsoleOpen: (isOpen: boolean) => void;
  consoleHeight: number;
  setConsoleHeight: (height: number) => void;

  // Global Settings
  globalSettings: PhysicsGlobalSettings;
  setGlobalSettings: React.Dispatch<
    React.SetStateAction<PhysicsGlobalSettings>
  >;

  // Modular State
  moduleStates: Record<string, Record<string, unknown>>;
  setModuleState: (
    moduleId: string,
    stateUpdate:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>),
  ) => void;

  // Quiz State
  activeQuiz: QuizQuestion | null;
  startQuiz: (quiz: QuizQuestion) => void;
  endQuiz: (success: boolean) => void;
}

export type PhysicsLabContextValue = UsePhysicsLabStateReturn;
