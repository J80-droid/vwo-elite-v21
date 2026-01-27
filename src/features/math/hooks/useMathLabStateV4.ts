/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any -- complex math hook with dynamic module registry types */
// useMathLabStateV4 - Centralized State Management Hook for MathLab
import { solveCalculus } from "@shared/api/gemini";
import { FormulaEntry, FORMULAS } from "@shared/lib/data/formulas";
import * as math from "mathjs";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getAllModules } from "../api/registry";
import {
  BinasVisConfig,
  ComputedVector,
  defaultAnalyticsState,
  defaultGlobalSettings,
  defaultThreeDState,
  defaultVectors,
  defaultVectorsState,
  GlobalSettings,
  MathModule,
  MatrixValues,
  Scenario,
  SNAPSHOT_PRESETS,
  SnapshotOptions,
  UseMathLabStateReturn,
  VectorData,
  VectorSettings,
} from "../types";
import { useParameterAnimation } from "./useParameterAnimation";

export function useMathLabState(
  initialModule?: MathModule,
): UseMathLabStateReturn {
  // --- Core State ---
  const [activeModule, setActiveModule] = useState<MathModule>(
    initialModule || "analytics",
  );

  // --- Modular State Initialization ---
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(
    defaultGlobalSettings,
  );

  const [moduleStates, setModuleStates] = useState<Record<string, any>>(() => {
    const states: Record<string, any> = {};
    getAllModules().forEach((mod) => {
      if (mod.initialState) {
        states[mod.id] = { ...mod.initialState };
      }
    });
    return states;
  });

  const setModuleState = useCallback(
    (moduleId: string, stateUpdate: any | ((prev: any) => any)) => {
      setModuleStates((prev) => {
        const currentModuleState = prev[moduleId] || {};
        const newState =
          typeof stateUpdate === "function"
            ? stateUpdate(currentModuleState)
            : stateUpdate;
        return {
          ...prev,
          [moduleId]: { ...currentModuleState, ...newState },
        };
      });
    },
    [],
  );

  const [vectorRemountKey, setVectorRemountKey] = useState(0);
  const [isVectorRecovering, setIsVectorRecovering] = useState(false);

  // --- 1. Analytics & Plotting State ---
  const [rawFunctions, setRawFunctions] = useState<string[]>(["a * x^2 + b"]);
  const [parameters, setParameters] = useState<Record<string, number>>({
    a: 1,
    b: 0,
    c: 1,
    k: 1,
  });
  const [animatingParams, setAnimatingParams] = useState<
    Record<string, boolean>
  >({});
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // AI Analysis (Mirrors legacy handleAiSolve)
  const handleAiAnalysis = async () => {
    if (!symbolicFn || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const result = await solveCalculus(symbolicFn);
      // Format for Modern UI (which expects a markdown string report)
      const report = `### AI Analyse voor $f(x) = ${symbolicFn}$\n\n**Wiskundige Regel:** ${result.rule}\n\n**Stappenplan:**\n${result.steps.map((s) => `- ${s}`).join("\n")}\n\n**Eindantwoord:**\n$$ ${result.finalAnswer} $$`;
      setAnalysisReport(report);
    } catch (e) {
      console.error(e);
      setAnalysisReport(
        "Er is een fout opgetreden bij de AI analyse. Probeer het later opnieuw.",
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Integral state
  const [integralState, setIntegralState] = useState<{
    show: boolean;
    from: number;
    to: number;
    result: string | null;
  }>({
    show: false,
    from: -1,
    to: 1,
    result: null,
  });

  const [riemannState, setRiemannState] = useState<{
    show: boolean;
    n: number;
    type: "left" | "right" | "midpoint";
  }>({ show: false, n: 10, type: "midpoint" });
  const [showTangent, setShowTangent] = useState(false);
  const [isTangentAnimating, setIsTangentAnimating] = useState(false);
  const [tangentSpeed, setTangentSpeed] = useState(1);
  const [showUnitCircle, setShowUnitCircle] = useState(false);
  const [unitCircleMode, setUnitCircleMode] = useState<
    "standard" | "components"
  >("standard");
  const [isAR, setIsAR] = useState(false);

  // Solution result (step-by-step)
  const [solutionResult, setSolutionResult] = useState<
    import("../api/StepSolver").SolutionResult | null
  >(null);

  // --- 2. Symbolic/Calculus State ---
  const [symbolicFn, setSymbolicFn] = useState("x^3 * sin(x)");
  const [symbolicResult, setSymbolicResult] = useState<{
    derivative?: string;
    integral?: string;
  }>({});

  // --- Layout State ---
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(300);

  // --- Vector Settings State ---
  const [showVectorSettings, setShowVectorSettings] = useState(false);

  // --- COMPUTED LEGACY SETTINGS ---
  // We reconstruct the monolithic VectorSettings object on the fly for backward compatibility.
  // This allows existing components to consume 'vectorSettings' as if nothing changed.
  const vectorSettings = useMemo((): VectorSettings => {
    const analyticsState = moduleStates["analytics"] || defaultAnalyticsState;
    const vectorsState = moduleStates["vectors"] || defaultVectorsState;
    const threeDState = moduleStates["3d"] || defaultThreeDState;

    return {
      ...globalSettings,
      ...analyticsState,
      ...vectorsState,
      ...threeDState,
    };
  }, [globalSettings, moduleStates]);

  // Backward compatible setter acts as a router
  const setVectorSettings = useCallback(
    (update: React.SetStateAction<VectorSettings>) => {
      // Warning: This logic is complex because we have to determine WHICH slice to update based on keys.
      // For simplicity, we update Generic + Active Module, or try to split.
      // But practically, most components modify specific keys.

      // Resolve the new values
      const newSettings =
        typeof update === "function" ? update(vectorSettings) : update;

      // 1. Update Global
      setGlobalSettings((prev) => ({ ...prev, ...newSettings })); // Overwrites global keys

      // 2. Update Modules (Broad cast approach - safe because keys don't overlap much)
      setModuleStates((prev) => ({
        ...prev,
        analytics: { ...prev.analytics, ...newSettings },
        vectors: { ...prev.vectors, ...newSettings },
        "3d": { ...prev["3d"], ...newSettings },
      }));
    },
    [vectorSettings],
  );

  // --- 3. Vectors State ---
  const [vectors, setVectors] = useState<VectorData[]>(defaultVectors);

  // --- 4. Formula State (Unified under moduleStates['formulas']) ---
  const formulasState = moduleStates["formulas"] || {};
  const search = formulasState.search || "";
  const selectedFormulaId = formulasState.selectedFormulaId || null;
  const browserOpen = formulasState.browserOpen || false;
  const formulaInputs = formulasState.formulaInputs || {};
  const targetVar = formulasState.targetVar || null;
  const calculatedResult = formulasState.calculatedResult || null;
  const binasVisConfig = formulasState.binasVisConfig || null;

  const [customFormulas, setCustomFormulas] = useState<FormulaEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Initialize formulas from localStorage
  useEffect(() => {
    const savedCustom = localStorage.getItem("vwo_elite_custom_formulas");
    if (savedCustom) {
      try {
        setCustomFormulas(JSON.parse(savedCustom));
      } catch (e) {
        console.error(e);
      }
    }
    const savedFavorites = localStorage.getItem("vwo_elite_favorite_formulas");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save formulas to localStorage
  useEffect(() => {
    localStorage.setItem(
      "vwo_elite_custom_formulas",
      JSON.stringify(customFormulas),
    );
  }, [customFormulas]);

  useEffect(() => {
    localStorage.setItem(
      "vwo_elite_favorite_formulas",
      JSON.stringify(favorites),
    );
  }, [favorites]);

  const allFormulas = useMemo(() => {
    return [...FORMULAS, ...customFormulas];
  }, [customFormulas]);

  const setSelectedFormulaId = useCallback(
    (id: string | null) => {
      const formula = allFormulas.find((f) => f.id === id);

      // Single update for module state, including vis config
      setModuleState("formulas", {
        selectedFormulaId: id,
        targetVar: null,
        calculatedResult: null,
        formulaInputs: {},
        binasVisConfig: formula?.vis
          ? { type: formula.vis.type, fn: formula.vis.fn }
          : null,
      });
    },
    [setModuleState, allFormulas],
  );

  const setSearch = useCallback(
    (s: string) => setModuleState("formulas", { search: s }),
    [setModuleState],
  );
  const setBrowserOpen = useCallback(
    (open: boolean) => setModuleState("formulas", { browserOpen: open }),
    [setModuleState],
  );
  const setFormulaInputs = useCallback(
    (inputs: any) => {
      setModuleState("formulas", (prev: any) => ({
        formulaInputs:
          typeof inputs === "function" ? inputs(prev.formulaInputs) : inputs,
      }));
    },
    [setModuleState],
  );
  const setTargetVar = useCallback(
    (v: string | null) => setModuleState("formulas", { targetVar: v }),
    [setModuleState],
  );
  const setCalculatedResult = useCallback(
    (res: string | null) =>
      setModuleState("formulas", { calculatedResult: res }),
    [setModuleState],
  );
  const setBinasVisConfig = useCallback(
    (cfg: BinasVisConfig | null) =>
      setModuleState("formulas", { binasVisConfig: cfg }),
    [setModuleState],
  );

  // --- 5. Matrix Transformation State ---
  const [matrixA, setMatrixA] = useState<number[][]>([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);
  const [matrixB, setMatrixB] = useState<number[][]>([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);
  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [activeMatrixOp, setActiveMatrixOp] = useState<{
    label: string;
    val: string;
    info?: { matrix: number[][]; type: "det" | "inv" };
  } | null>(null);

  // Computed matrixValues from matrixA for backward compatibility
  const matrixValues = useMemo(
    (): MatrixValues => ({
      m11: matrixA[0]?.[0] ?? 1,
      m12: matrixA[0]?.[1] ?? 0,
      m13: matrixA[0]?.[2] ?? 0,
      m21: matrixA[1]?.[0] ?? 0,
      m22: matrixA[1]?.[1] ?? 1,
      m23: matrixA[1]?.[2] ?? 0,
      m31: matrixA[2]?.[0] ?? 0,
      m32: matrixA[2]?.[1] ?? 0,
      m33: matrixA[2]?.[2] ?? 1,
    }),
    [matrixA],
  );

  // --- Screenshot State ---
  const [screenshotStatus, setScreenshotStatus] = useState<
    "idle" | "configuring" | "capturing" | "saved" | "error"
  >("idle");
  const [isCapturing, setIsCapturing] = useState(false);
  const [snapshotOpts, setSnapshotOpts] = useState<SnapshotOptions>(
    SNAPSHOT_PRESETS.pws as SnapshotOptions,
  );

  // --- Sonification State ---
  const [isSonifying, setIsSonifying] = useState(false);
  const [scannerX, setScannerX] = useState<number | null>(null);

  // --- Animation State ---
  const [isAnimatingLiquid, setIsAnimatingLiquid] = useState(false);

  // --- Scenario Management ---
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [newScenarioName, setNewScenarioName] = useState("");

  // --- Animation Loop ---
  useParameterAnimation(parameters, setParameters, animatingParams);

  // --- Computed Values ---
  const processedFunctions = useMemo(() => {
    return rawFunctions.map((fn) => {
      let p = fn;
      Object.entries(parameters).forEach(([key, val]) => {
        p = p.replace(new RegExp(`\\b${key}\\b`, "g"), `(${val})`);
      });
      return p;
    });
  }, [rawFunctions, parameters]);

  // Dynamic Defaults
  useEffect(() => {
    const plotMode =
      (moduleStates["analytics"] as any)?.plotMode || "cartesian";
    const firstFn = rawFunctions[0] || "";
    if (
      plotMode === "parametric" &&
      rawFunctions.length === 1 &&
      !firstFn.includes(";")
    ) {
      setRawFunctions(["cos(t)", "sin(t)"]);
    } else if (plotMode === "polar" && !firstFn.includes("theta")) {
      setRawFunctions(["1 + cos(theta)"]);
    } else if (
      plotMode === "cartesian" &&
      (firstFn.includes("t)") || firstFn.includes("theta"))
    ) {
      setRawFunctions(["a * x^2 + b"]);
    }
  }, [moduleStates.analytics?.plotMode, rawFunctions]);

  const computedVectors = useMemo((): ComputedVector[] => {
    return vectors.map((v) => {
      try {
        const scope = { ...parameters, t: 0 };
        const x = math.evaluate(v.x, scope);
        const y = math.evaluate(v.y, scope);
        const z = math.evaluate(v.z, scope);
        return {
          ...v,
          x: typeof x === "number" ? x : 0,
          y: typeof y === "number" ? y : 0,
          z: typeof z === "number" ? z : 0,
        };
      } catch {
        return { ...v, x: 0, y: 0, z: 0 };
      }
    });
  }, [vectors, parameters]);

  const resultantVector = useMemo((): ComputedVector | null => {
    if (!vectorSettings.showResultant || computedVectors.length === 0)
      return null;
    const sum = computedVectors.reduce(
      (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y, z: acc.z + v.z }),
      { x: 0, y: 0, z: 0 },
    );
    return { ...sum, id: "resultant", symbol: "Σ", color: "#a855f7" };
  }, [computedVectors, vectorSettings.showResultant]);

  const crossProductVector = useMemo((): ComputedVector | null => {
    if (!vectorSettings.showCrossProduct || computedVectors.length < 2)
      return null;
    const a = computedVectors[0]!;
    const b = computedVectors[1]!;
    const cp = {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
    return { ...cp, id: "crossproduct", symbol: "n", color: "#fbbf24" };
  }, [computedVectors, vectorSettings.showCrossProduct]);

  // --- Scenario Effects ---
  useEffect(() => {
    const saved = localStorage.getItem("vwo_elite_scenarios");
    if (saved) {
      try {
        setScenarios(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load scenarios", e);
      }
    }
  }, []);

  const saveScenario = () => {
    if (!newScenarioName.trim()) return;
    const scenario: Scenario = {
      name: newScenarioName,
      date: Date.now(),
      data: {
        vectors,
        vectorSettings,
        matrixValues,
        parameters,
        activeModule,
      },
    };
    const updated = [...scenarios, scenario];
    setScenarios(updated);
    localStorage.setItem("vwo_elite_scenarios", JSON.stringify(updated));
    setNewScenarioName("");
  };

  const loadScenario = (scenario: Scenario) => {
    if (!scenario.data) return;
    const {
      vectors: v,
      vectorSettings: s,
      matrixValues: m,
      parameters: p,
      activeModule: a,
    } = scenario.data;
    if (v) setVectors(v);
    if (s) {
      // BACKWARD COMPAT: If loading old scenario, we need to distribute 's' (VectorSettings)
      // back into the global/module states.
      setGlobalSettings((prev) => ({ ...prev, ...s }));
      setModuleStates((prev) => ({
        ...prev,
        analytics: { ...prev.analytics, ...s },
        vectors: { ...prev.vectors, ...s },
        "3d": { ...prev["3d"], ...s },
      }));
    }
    if (m) {
      setMatrixA([
        [m.m11, m.m12, m.m13],
        [m.m21, m.m22, m.m23],
        [m.m31, m.m32, m.m33],
      ]);
    }
    if (p) setParameters(p);
    if (a) setActiveModule(a);
  };

  const deleteScenario = (name: string) => {
    const updated = scenarios.filter((s) => s.name !== name);
    setScenarios(updated);
    localStorage.setItem("vwo_elite_scenarios", JSON.stringify(updated));
  };

  const memoizedValue = useMemo(
    () => ({
      // Module
      activeModule,
      setActiveModule,

      // NEW: Modular State Access
      globalSettings,
      setGlobalSettings,
      moduleStates,
      setModuleState,

      // Analytics
      rawFunctions,
      setRawFunctions,
      parameters,
      setParameters,
      animatingParams,
      setAnimatingParams,
      processedFunctions,
      analysisReport,
      setAnalysisReport,
      isAiLoading,
      setIsAiLoading,
      handleAiAnalysis,

      // Integral
      integralState,
      setIntegralState,

      riemannState,
      setRiemannState,
      showTangent,
      setShowTangent,
      isTangentAnimating,
      setIsTangentAnimating,
      tangentSpeed,
      setTangentSpeed,
      showUnitCircle,
      setShowUnitCircle,
      unitCircleMode,
      setUnitCircleMode,
      isAR,
      setIsAR,

      // Solution
      solutionResult,
      setSolutionResult,

      // Symbolic
      symbolicFn,
      setSymbolicFn,
      symbolicResult,
      setSymbolicResult,

      // Vectors
      vectors,
      setVectors,
      computedVectors,

      // LEGACY COMPAT: vectorSettings
      vectorSettings,
      setVectorSettings,

      showVectorSettings,
      setShowVectorSettings,
      vectorRemountKey,
      setVectorRemountKey,
      isVectorRecovering,
      setIsVectorRecovering,
      resultantVector,
      crossProductVector,

      // Matrix
      matrixA,
      setMatrixA,
      matrixB,
      setMatrixB,
      matrixValues,
      isMatrixActive,
      setIsMatrixActive,
      activeMatrixOp,
      setActiveMatrixOp,

      // Formula
      search,
      setSearch,
      selectedFormulaId,
      setSelectedFormulaId,
      browserOpen,
      setBrowserOpen,
      formulaInputs,
      setFormulaInputs,
      targetVar,
      setTargetVar,
      calculatedResult,
      setCalculatedResult,
      binasVisConfig,
      setBinasVisConfig,
      allFormulas,
      customFormulas,
      favorites,
      toggleFavorite: (id: string) => {
        setFavorites((prev) =>
          prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id],
        );
      },
      addCustomFormula: (formula: FormulaEntry) => {
        setCustomFormulas((prev) => [...prev, formula]);
      },

      // Layout
      isConsoleOpen,
      setIsConsoleOpen,
      consoleHeight,
      setConsoleHeight,

      // Screenshot
      screenshotStatus,
      setScreenshotStatus,
      isCapturing,
      setIsCapturing,
      snapshotOpts,
      setSnapshotOpts,

      // Sonification
      isSonifying,
      setIsSonifying,
      scannerX,
      setScannerX,

      // Animation
      isAnimatingLiquid,
      setIsAnimatingLiquid,

      // Scenarios
      scenarios,
      newScenarioName,
      setNewScenarioName,
      saveScenario,
      loadScenario,
      deleteScenario,
    }),
    [
      activeModule,
      globalSettings,
      moduleStates,
      setModuleState,
      rawFunctions,
      parameters,
      animatingParams,
      processedFunctions,
      analysisReport,
      isAiLoading,
      integralState,
      riemannState,
      showTangent,
      isTangentAnimating,
      tangentSpeed,
      showUnitCircle,
      unitCircleMode,
      isAR,
      solutionResult,
      symbolicFn,
      symbolicResult,
      vectors,
      computedVectors,
      vectorSettings,
      setVectorSettings,
      showVectorSettings,
      vectorRemountKey,
      isVectorRecovering,
      resultantVector,
      crossProductVector,
      matrixA,
      matrixB,
      matrixValues,
      isMatrixActive,
      activeMatrixOp,
      search,
      selectedFormulaId,
      setSelectedFormulaId,
      browserOpen,
      setBrowserOpen,
      formulaInputs,
      setFormulaInputs,
      targetVar,
      setTargetVar,
      calculatedResult,
      setCalculatedResult,
      binasVisConfig,
      setBinasVisConfig,
      setSearch,
      allFormulas,
      customFormulas,
      favorites,
      isConsoleOpen,
      screenshotStatus,
      isCapturing,
      snapshotOpts,
      isSonifying,
      scannerX,
      isAnimatingLiquid,
      scenarios,
      newScenarioName,
      saveScenario,
      loadScenario,
      deleteScenario,
    ],
  );

  return memoizedValue;
}
