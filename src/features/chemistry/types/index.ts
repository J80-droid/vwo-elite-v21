/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideIcon } from "lucide-react";
import React from "react";

// Generiek type voor modules, vergelijkbaar met MathModule
export type ChemistryModule = string;

export interface ChemistryModuleConfig {
  id: ChemistryModule;
  label: (t: any) => string;
  description?: (t: any) => string;
  icon: LucideIcon;
  // Component references for rendering (Lazy loaded via Layout)
  StageComponent?: React.ComponentType<any>;
  InputComponent?: React.ComponentType<any>;
  // Optioneel: specifieke kleurinstellingen voor de module
  color?: string;
  borderColor?: string;
  // Initial state voor deze module
  initialState?: Record<string, any>;
}

export interface ChemistryGlobalSettings {
  // Voorbeeld: globale settings zoals 'showLabels', 'highQuality'
  showLabels: boolean;
  highQuality: boolean;
}

export const defaultChemistryGlobalSettings: ChemistryGlobalSettings = {
  showLabels: true,
  highQuality: true,
};

export interface VisualizerModuleState {
  query: string;
  moleculeId: string | null;
  analysis: string | null;
}

// Placeholder voor andere modules
export interface ReactionModuleState { }
export interface TitrationModuleState {
  voiceActive: boolean;
}
export interface OrbitalsModuleState { }

// --- CHEMISTRY STATE ---

export interface ChemistryState {
  ph: number;
  phHistory: number[];
  temperature: number;
  tempHistory: number[];
  concentration: number;
  isReacting: boolean;
  deltaH: number;
  activationEnergy: number;
}

export const defaultChemistryState: ChemistryState = {
  ph: 7.0,
  phHistory: [],
  temperature: 20.0,
  tempHistory: [],
  concentration: 0.1,
  isReacting: false,
  deltaH: -20,
  activationEnergy: 50,
};

export interface ChemistryLabProps {
  initialModule?: ChemistryModule;
}
