/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideIcon } from "lucide-react";
import React from "react";

export interface PsychologyModule {
  id: string;
  label: (t: any) => string;
  icon: LucideIcon;
  description: string;
  color: string;
  borderColor: string;
  // Layout Components
  StageComponent?: React.FC<any>;
  SidebarComponent?: React.FC<any>;
  component?: React.FC<any>; // Legacy fallback
}

export type PsychologyModuleConfig = PsychologyModule;

export interface PsychologyGlobalSettings {
  theme: "dark" | "light";
  showTooltips: boolean;
}

export const defaultPsychologyGlobalSettings: PsychologyGlobalSettings = {
  theme: "dark",
  showTooltips: true,
};

// Module specific states

export interface CognitionState {
  activeTest: "reaction" | "memory" | "stroop" | null;
  status: "idle" | "playing" | "complete";
  score: number;
  highScores: Record<string, number>;
}

export const defaultCognitionState: CognitionState = {
  activeTest: null,
  status: "idle",
  score: 0,
  highScores: {},
};

// ... placeholders for others
