/* eslint-disable @typescript-eslint/no-explicit-any */
// MathLab Types
// Shared type definitions for MathLab components
import { RefObject } from "react";

import {
  GraphPlotterHandle,
  SurfacePlotterHandle,
} from "../../../components/visualization/types";

// CORE ARCHITECTURE V3: Generic Module ID
export type MathModule = string;

export interface MathLabProps {
  initialModule?: MathModule;
}

export interface ModuleStageProps {
  consoleExpanded: boolean;
  consoleHeight: number;
  graphPlotterRef?: RefObject<GraphPlotterHandle | null>;
  surfacePlotterRef?: RefObject<SurfacePlotterHandle | null>;
}

export interface VectorData {
  id: string;
  symbol: string;
  x: string;
  y: string;
  z: string;
  color: string;
}

export interface ComputedVector {
  id: string;
  symbol: string;
  x: number;
  y: number;
  z: number;
  color: string;
}

export interface MathModuleConfig {
  /** Unique module identifier */
  id: MathModule;
  /** Localized label function */
  label: (t: (key: string) => string) => string;
  /** Lucide icon component */
  icon: any; // Using any to avoid importing LucideIcon here if not needed, or explicit import
  /** Short description for the dashboard card */
  description?: string;
  /** Tailwind text color class */
  color: string;
  /** Tailwind border color class */
  borderColor?: string;
  /** Initial state for the module (will be merged into global moduleStates) */
  initialState?: any;
}

// --- NEW MODULAR STATE ARCHITECTURE ---

// 1. GLOBAL Settings (Shared across ALL modules)
export interface GlobalSettings {
  showGrid: boolean;
  showAxes: boolean;
  autoRotate: boolean;
  isAnimating: boolean;
  animationSpeed: number;
  // Common camera/view props could go here
  themeMode: "dark" | "light"; // Example
}

export interface UseMathLabStateReturn {
  // Module state
  activeModule: MathModule;
  setActiveModule: (module: MathModule) => void;

  // --- NEW: Modular State Access ---
  globalSettings: GlobalSettings;
  setGlobalSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  moduleStates: Record<string, any>;
  setModuleState: (
    moduleId: string,
    stateUpdate: any | ((prev: any) => any),
  ) => void;

  // Analytics state
  rawFunctions: string[];
  setRawFunctions: React.Dispatch<React.SetStateAction<string[]>>;
  parameters: Record<string, number>;
  setParameters: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  animatingParams: Record<string, boolean>;
  setAnimatingParams: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  processedFunctions: string[];
  analysisReport: string | null;
  setAnalysisReport: (report: string | null) => void;
  isAiLoading: boolean;
  setIsAiLoading: (loading: boolean) => void;
  handleAiAnalysis: () => Promise<void>;

  // Integral state
  integralState: {
    show: boolean;
    from: number;
    to: number;
    result: string | null;
  };
  setIntegralState: React.Dispatch<
    React.SetStateAction<{
      show: boolean;
      from: number;
      to: number;
      result: string | null;
    }>
  >;

  // Didactic states (V2.0)
  riemannState: {
    show: boolean;
    n: number;
    type: "left" | "right" | "midpoint";
  };
  setRiemannState: React.Dispatch<
    React.SetStateAction<{
      show: boolean;
      n: number;
      type: "left" | "right" | "midpoint";
    }>
  >;
  showTangent: boolean;
  setShowTangent: (show: boolean) => void;
  isTangentAnimating: boolean;
  setIsTangentAnimating: (animating: boolean) => void;
  tangentSpeed: number;
  setTangentSpeed: (speed: number) => void;
  showUnitCircle: boolean;
  setShowUnitCircle: (show: boolean) => void;
  unitCircleMode: "standard" | "components";
  setUnitCircleMode: (mode: "standard" | "components") => void;
  isAR: boolean;
  setIsAR: (isAR: boolean) => void;

  // Solution state (step-by-step)
  solutionResult: import("../api/StepSolver").SolutionResult | null;
  setSolutionResult: React.Dispatch<
    React.SetStateAction<import("../api/StepSolver").SolutionResult | null>
  >;

  // Symbolic state
  symbolicFn: string;
  setSymbolicFn: (fn: string) => void;
  symbolicResult: { derivative?: string; integral?: string };
  setSymbolicResult: React.Dispatch<
    React.SetStateAction<{ derivative?: string; integral?: string }>
  >;

  // Vector state
  vectors: VectorData[];
  setVectors: React.Dispatch<React.SetStateAction<VectorData[]>>;
  computedVectors: ComputedVector[];

  // LEGACY: Computed 'vectorSettings' for backward compatibility
  vectorSettings: VectorSettings;
  setVectorSettings: React.Dispatch<React.SetStateAction<VectorSettings>>;

  showVectorSettings: boolean;
  setShowVectorSettings: (show: boolean) => void;
  vectorRemountKey: number;
  setVectorRemountKey: React.Dispatch<React.SetStateAction<number>>;
  isVectorRecovering: boolean;
  setIsVectorRecovering: (recovering: boolean) => void;

  // Derived vectors
  resultantVector: ComputedVector | null;
  crossProductVector: ComputedVector | null;

  // Matrix state (now with A and B)
  matrixA: number[][];
  setMatrixA: React.Dispatch<React.SetStateAction<number[][]>>;
  matrixB: number[][];
  setMatrixB: React.Dispatch<React.SetStateAction<number[][]>>;
  matrixValues: MatrixValues;
  isMatrixActive: boolean;
  setIsMatrixActive: (active: boolean) => void;
  activeMatrixOp: {
    label: string;
    val: string;
    info?: { matrix: number[][]; type: "det" | "inv" };
  } | null;
  setActiveMatrixOp: React.Dispatch<
    React.SetStateAction<{
      label: string;
      val: string;
      info?: { matrix: number[][]; type: "det" | "inv" };
    } | null>
  >;

  // Formula state
  search: string;
  setSearch: (search: string) => void;
  selectedFormulaId: string | null;
  setSelectedFormulaId: (id: string | null) => void;
  browserOpen: boolean;
  setBrowserOpen: (open: boolean) => void;
  formulaInputs: Record<string, string>;
  setFormulaInputs: (inputs: any) => void;
  targetVar: string | null;
  setTargetVar: (v: string | null) => void;
  calculatedResult: string | null;
  setCalculatedResult: (result: string | null) => void;
  binasVisConfig: BinasVisConfig | null;
  setBinasVisConfig: (config: BinasVisConfig | null) => void;

  // Formula Data
  allFormulas: FormulaEntry[];
  customFormulas: FormulaEntry[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  addCustomFormula: (formula: FormulaEntry) => void;

  // Layout state
  isConsoleOpen: boolean;
  setIsConsoleOpen: (open: boolean) => void;
  consoleHeight: number;
  setConsoleHeight: (height: number) => void;

  // Screenshot state
  screenshotStatus: "idle" | "configuring" | "capturing" | "saved" | "error";
  setScreenshotStatus: (
    status: "idle" | "configuring" | "capturing" | "saved" | "error",
  ) => void;
  isCapturing: boolean;
  setIsCapturing: (capturing: boolean) => void;
  snapshotOpts: SnapshotOptions;
  setSnapshotOpts: React.Dispatch<React.SetStateAction<SnapshotOptions>>;

  // Sonification
  isSonifying: boolean;
  setIsSonifying: (sonifying: boolean) => void;
  scannerX: number | null;
  setScannerX: (x: number | null) => void;

  // Animation
  isAnimatingLiquid: boolean;
  setIsAnimatingLiquid: (animating: boolean) => void;

  // Scenario management
  scenarios: Scenario[];
  newScenarioName: string;
  setNewScenarioName: (name: string) => void;
  saveScenario: () => void;
  loadScenario: (scenario: Scenario) => void;
  deleteScenario: (name: string) => void;

  // Layout Sections (publicly exposed for layout consumption)
  inputSection?: React.ReactNode;
  paramsSection?: React.ReactNode;
  resultsSection?: React.ReactNode;
  stageSection?: React.ReactNode;
}

// 2. MODULE-SPECIFIC Settings Interfaces

export interface AnalyticsModuleState {
  plotMode: "cartesian" | "parametric" | "polar";
  showAsymptotes: boolean;
  showInflectionPoints: boolean;
  showTangentAtCursor: boolean;
  showSecantLine: boolean;
  showAreaUnderCurve: boolean;
  // Didactic Tools
  showRiemann: boolean;
  riemannType: "left" | "right" | "midpoint" | "trapezoidal" | "simpson";
  riemannIntervals: number;
  showTangent: boolean;
  isTangentAnimating: boolean;
  tangentSpeed: number;
  showUnitCircle: boolean;
  unitCircleMode: "standard" | "components";
  // V2.1 Depth Features
  showDerivativeGraph: boolean;
}

export interface VectorsModuleState {
  showProjections: boolean;
  showResultant: boolean;
  showCrossProduct: boolean;
  showDotProduct: boolean;
  showPlane: boolean;
  showAngles: boolean;
  showSnapping: boolean;
  showEigenvectors: boolean;
  showGhosting: boolean;
  showPhysics: boolean;
  showValues: boolean;
  traceMode: boolean;
  showBasisVectors: boolean;
  vectorThickness: number;
  showLinearCombination: boolean;
  showSpan: boolean;
  showNormals: boolean;
}

export interface ThreeDModuleState {
  animationSpeed: number;
  showGradients: boolean;
  showContours: boolean;
  showLaser: boolean;
  showGlass: boolean;
  showTangent: boolean;
  showCritical: boolean;
  showSlice: boolean;
  wireframe: boolean;
  surfaceResolution: number;
  surfaceRange: number;
  surfaceColor1: string;
  surfaceColor2: string;
  liquidStrength: number;
  liquidSpeed: number;
  bloomThreshold: number;
  bloomIntensity: number;
  surfaceOpacity: number;
  surfaceRoughness: number;
  surfaceShininess: number;
  colorMode: "height" | "gaussian" | "mean";
  showStreamlines: boolean;
  showVolume: boolean;
  showShadowMap: boolean;
  chromaticAberration: number;
  vignette: number;
  showHologram: boolean;
  dofIntensity: number;
  sunPosition: [number, number, number];
  lightColor: string;
  clipX: number;
  clipY: number;
  clipZ: number;
  autoOrbit: boolean;
}

export interface FormulasModuleState {
  search: string;
  browserOpen: boolean;
  activeCategory: string | null;
  // Calculation State
  selectedFormulaId: string | null;
  formulaInputs: Record<string, string>;
  targetVar: string | null;
  calculatedResult: string | null;
  binasVisConfig: BinasVisConfig | null;
}

export interface SymbolicModuleState {
  expression: string;
  history: string[];
  // Transient solver state might stay in context or here if we want persistence
  // For now we persist the input expression
}

// Union type for legacy compatibility or helper functions
export type AnyModuleState =
  | AnalyticsModuleState
  | VectorsModuleState
  | ThreeDModuleState
  | FormulasModuleState
  | SymbolicModuleState;

// LEGACY: We keep VectorSettings as a "Mega Type" for now to avoid breaking
// every single component immediately, but we will construct it from the pieces.
export interface VectorSettings
  extends
    GlobalSettings,
    AnalyticsModuleState,
    VectorsModuleState,
    ThreeDModuleState {}

export interface BinasVisConfig {
  type: "plot" | "diagram" | "table" | "vector";
  fn: string;
  title?: string;
  yLabel?: string;
  xLabel?: string;
}

export interface MatrixValues {
  m11: number;
  m12: number;
  m13: number;
  m21: number;
  m22: number;
  m23: number;
  m31: number;
  m32: number;
  m33: number;
}

export interface Scenario {
  name: string;
  date: number;
  data: {
    vectors: VectorData[];
    // Stores the FULL merged settings for now to ensure back-compat
    vectorSettings: VectorSettings;
    matrixValues: MatrixValues;
    parameters: Record<string, number>;
    activeModule: MathModule;
  };
}

// --- DEFAULT VALUES ---

export const defaultGlobalSettings: GlobalSettings = {
  showGrid: true,
  showAxes: true,
  autoRotate: false,
  isAnimating: true,
  animationSpeed: 1,
  themeMode: "dark",
};

export const defaultAnalyticsState: AnalyticsModuleState = {
  plotMode: "cartesian",
  showAsymptotes: false,
  showInflectionPoints: false,
  showTangentAtCursor: false,
  showSecantLine: false,
  showAreaUnderCurve: false,
  // Didactic defaults
  showRiemann: false,
  riemannType: "left",
  riemannIntervals: 10,
  showTangent: false,
  isTangentAnimating: false,
  tangentSpeed: 1,
  showUnitCircle: false,
  unitCircleMode: "standard",
  showDerivativeGraph: false,
};

export const defaultVectorsState: VectorsModuleState = {
  showProjections: false,
  showResultant: false,
  showCrossProduct: false,
  showDotProduct: false,
  showPlane: false,
  showAngles: false,
  showSnapping: true,
  showEigenvectors: false,
  showGhosting: false,
  showPhysics: false,
  showValues: false,
  traceMode: false,
  showBasisVectors: false,
  vectorThickness: 2,
  showLinearCombination: false,
  showSpan: false,
  showNormals: false,
};

export const defaultThreeDState: ThreeDModuleState = {
  animationSpeed: 1,
  showGradients: false,
  showContours: false,
  showLaser: false,
  showGlass: false,
  showTangent: false,
  showCritical: false,
  showSlice: false,
  wireframe: false,
  surfaceResolution: 50,
  surfaceRange: 5,
  surfaceColor1: "#A06CD5",
  surfaceColor2: "#facc15",
  liquidStrength: 0.05,
  liquidSpeed: 5,
  bloomThreshold: 1.2,
  bloomIntensity: 0.6,
  surfaceOpacity: 1,
  surfaceRoughness: 0.2,
  surfaceShininess: 30,
  colorMode: "height",
  showStreamlines: false,
  showVolume: false,
  showShadowMap: false,
  chromaticAberration: 0,
  vignette: 0,
  showHologram: false,
  dofIntensity: 0,
  sunPosition: [10, 10, 10],
  lightColor: "#ffffff",
  clipX: 1,
  clipY: 1,
  clipZ: 1,
  autoOrbit: false,
};

// Aggregated Default (Legacy)
export const defaultVectorSettings: VectorSettings = {
  ...defaultGlobalSettings,
  ...defaultAnalyticsState,
  ...defaultVectorsState,
  ...defaultThreeDState,
};

export const defaultMatrixValues: MatrixValues = {
  m11: 1,
  m12: 0,
  m13: 0,
  m21: 0,
  m22: 1,
  m23: 0,
  m31: 0,
  m32: 0,
  m33: 1,
};

// Snapshot configuration options
export type SnapshotOptions = {
  showTitle: boolean;
  showFunctions: boolean;
  showAnalysis: boolean;
  showTimestamp: boolean;
  showWatermark: boolean;
  showParams: boolean;
  showGrid: boolean;
  showIntersections: boolean;
  showIntegral: boolean;
  showColorLegend: boolean;
  customTitle: string;
};

export const SNAPSHOT_PRESETS: Record<string, SnapshotOptions> = {
  pws: {
    showTitle: true,
    showFunctions: true,
    showAnalysis: true,
    showTimestamp: true,
    showWatermark: true,
    showParams: true,
    showGrid: false,
    showIntersections: true,
    showIntegral: true,
    showColorLegend: true,
    customTitle: "",
  },
  quick: {
    showTitle: true,
    showFunctions: true,
    showAnalysis: false,
    showTimestamp: false,
    showWatermark: false,
    showParams: false,
    showGrid: false,
    showIntersections: false,
    showIntegral: false,
    showColorLegend: false,
    customTitle: "",
  },
  clean: {
    showTitle: false,
    showFunctions: false,
    showAnalysis: false,
    showTimestamp: false,
    showWatermark: false,
    showParams: false,
    showGrid: false,
    showIntersections: false,
    showIntegral: false,
    showColorLegend: false,
    customTitle: "",
  },
};

export const defaultVectors: VectorData[] = [
  { id: "1", symbol: "v1", x: "1", y: "2", z: "3", color: "#3b82f6" },
  { id: "2", symbol: "v2", x: "2", y: "-1", z: "1", color: "#ef4444" },
];

// --- CONTEXT TYPES ---
import { FormulaEntry } from "@shared/lib/data/formulas";
export interface MathLabContextValue extends UseMathLabStateReturn {
  surfacePlotterRef: RefObject<SurfacePlotterHandle | null>;
  graphPlotterRef: RefObject<GraphPlotterHandle | null>;
}
