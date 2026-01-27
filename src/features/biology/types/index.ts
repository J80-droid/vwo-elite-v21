import { LucideIcon } from "lucide-react";
import React from "react";

export interface BiologyModule {
  id: string;
  label: (t: (key: string, defaultValue?: string) => string) => string;
  icon: LucideIcon;
  description: string;
  color: string;
  borderColor: string;
  // Component references (Lazy loaded via Layout)
  StageComponent?: React.ComponentType<Record<string, unknown>>;
  SidebarComponent?: React.ComponentType<Record<string, unknown>>; // Instrumentation
  ParametersComponent?: React.ComponentType<Record<string, unknown>>;
  AnalysisComponent?: React.ComponentType<Record<string, unknown>>;
}

export type BiologyModuleConfig = BiologyModule;

export interface MasteryState {
  genomics: number;
  microscopy: number;
  ecology: number;
  physiology: number;
  protein: number;
  bloomLevels: {
    Knowing: number;
    Understanding: number;
    Applying: number;
    Analyzing: number;
  };
}

export interface BiologyGlobalSettings {
  theme: "dark" | "light";
  showTooltips: boolean;
  mastery: MasteryState;
}

export const defaultBiologyGlobalSettings: BiologyGlobalSettings = {
  theme: "dark",
  showTooltips: true,
  mastery: {
    genomics: 0,
    microscopy: 0,
    ecology: 0,
    physiology: 0,
    protein: 0,
    bloomLevels: {
      Knowing: 0,
      Understanding: 0,
      Applying: 0,
      Analyzing: 0,
    },
  },
};

// Module specific states

export interface GenomicsState {
  sequence: string;
  pdbId: string;
  viewMode: "pdb" | "procedural";
  selectedIndex: number | null;
  mutatedIndex: number | null;
  missionTarget: "Silent" | "Missense" | "Nonsense" | null;
  analyzing: boolean;
  analysisResult: string | null;
  replicationMode: boolean;
  activeTool: "none" | "gel" | "pcr" | "crispr";
}

export const defaultGenomicsState: GenomicsState = {
  sequence: "ATGCGATCGTAGCTAGCTAGCTA",
  pdbId: "1CRN",
  viewMode: "procedural",
  selectedIndex: null,
  mutatedIndex: null,
  missionTarget: null,
  analyzing: false,
  analysisResult: null,
  replicationMode: false,
  activeTool: "none",
};

// ... placeholders for others
export interface MicroscopyState {
  zoom: number;
  brightness: number;
  contrast: number;
  selectedSlide: string | null;
}

export interface EcologyState {
  preyCount: number;
  predatorCount: number;
  growthRatePrey: number;
  growthRatePredator: number;
  consumptionRate: number;
  mortalityRatePredator: number;
  carryingCapacity: number;
}

export interface PhysiologyState {
  activeSystem: "circulatory" | "respiratory" | "nervous" | "endocrine" | null;
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
}

export interface ProteinState {
  query: string;
  results: import("@shared/api/alphafoldService").ProteinSearchResult[];
  selectedProtein: import("@shared/api/alphafoldService").ProteinSearchResult | null;
  loading: boolean;
  error: string | null;
}

export const defaultMicroscopyState: MicroscopyState = {
  zoom: 40,
  brightness: 100,
  contrast: 100,
  selectedSlide: null,
};

export const defaultEcologyState: EcologyState = {
  preyCount: 50,
  predatorCount: 10,
  growthRatePrey: 0.1,
  growthRatePredator: 0.05,
  consumptionRate: 0.01,
  mortalityRatePredator: 0.1,
  carryingCapacity: 200,
};

export const defaultPhysiologyState: PhysiologyState = {
  activeSystem: null,
  heartRate: 70,
  bloodPressure: { systolic: 120, diastolic: 80 },
};

export const defaultProteinState: ProteinState = {
  query: "",
  results: [],
  selectedProtein: null,
  loading: false,
  error: null,
};
