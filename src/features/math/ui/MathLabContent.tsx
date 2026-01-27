/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic mathlab layout and module configurations */
/**
 * MathLab Content Helpers
 *
 * Hooks for dynamic module rendering using the registry.
 * Replaces inline module UI with registry-based component rendering.
 */

// Import all modules to trigger auto-registration
import "./modules";

import React, { useMemo } from "react";

import { getAllModules, getModuleConfig } from "../api/registry";
import { useMathLabContext } from "../hooks/useMathLabContext";
import { ModuleStageProps } from "../types";
import { EliteLoader } from "./common/EliteLoader";

// DATA-ONLY REGISTRY MAPPING
// We map the string IDs to the actual Lazy Components here, preventing
// circular dependency chains or eager loading of heavy chunks.
const MODULE_COMPONENTS: Record<
  string,
  {
    Input: React.LazyExoticComponent<any>;
    Params: React.LazyExoticComponent<any>;
    Results: React.LazyExoticComponent<any>;
    Stage: React.LazyExoticComponent<
      React.ComponentType<ModuleStageProps>
    > | null;
  }
> = {
  analytics: {
    Input: React.lazy(() =>
      import("./modules/analytics/AnalyticsInput").then((m) => ({
        default: m.AnalyticsInput,
      })),
    ),
    Params: React.lazy(() =>
      import("./modules/analytics/AnalyticsParams").then((m) => ({
        default: m.AnalyticsParams,
      })),
    ),
    Results: React.lazy(() =>
      import("./modules/analytics/AnalyticsResults").then((m) => ({
        default: m.AnalyticsResults,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/analytics/AnalyticsStage").then((m) => ({
        default: m.AnalyticsStage,
      })),
    ),
  },
  vectors: {
    Input: React.lazy(() =>
      import("./modules/vectors/VectorsInput").then((m) => ({
        default: m.VectorsInput,
      })),
    ),
    Params: React.lazy(() =>
      import("./modules/vectors/VectorsParams").then((m) => ({
        default: m.VectorsParams,
      })),
    ),
    Results: React.lazy(() =>
      import("./modules/vectors/VectorsResults").then((m) => ({
        default: m.VectorsResults,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/vectors/VectorsStage").then((m) => ({
        default: m.VectorsStage,
      })),
    ),
  },
  "3d": {
    Input: React.lazy(() =>
      import("./modules/threed/ThreeDInput").then((m) => ({
        default: m.ThreeDInput,
      })),
    ),
    Params: React.lazy(() =>
      import("./modules/threed/ThreeDParams").then((m) => ({
        default: m.ThreeDParams,
      })),
    ),
    Results: React.lazy(() =>
      import("./modules/threed/ThreeDResults").then((m) => ({
        default: m.ThreeDResults,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/threed/ThreeDStage").then((m) => ({
        default: m.ThreeDStage,
      })),
    ),
  },
  formulas: {
    Input: React.lazy(() =>
      import("./modules/formulas/FormulasInput").then((m) => ({
        default: m.FormulasInput,
      })),
    ),
    Params: React.lazy(() =>
      import("./modules/formulas/FormulasParams").then((m) => ({
        default: m.FormulasParams,
      })),
    ),
    Results: React.lazy(() =>
      import("./modules/formulas/FormulasResults").then((m) => ({
        default: m.FormulasResults,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/formulas/FormulasStage").then((m) => ({
        default: m.FormulasStage,
      })),
    ),
  },
  symbolic: {
    Input: React.lazy(() =>
      import("./modules/symbolic/SymbolicInput").then((m) => ({
        default: m.SymbolicInput,
      })),
    ),
    Params: React.lazy(() =>
      import("./modules/symbolic/SymbolicParams").then((m) => ({
        default: m.SymbolicParams,
      })),
    ),
    Results: React.lazy(() =>
      import("./modules/symbolic/SymbolicResults").then((m) => ({
        default: m.SymbolicResults,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/symbolic/SymbolicStage").then((m) => ({
        default: m.SymbolicStage,
      })),
    ),
  },
  gym: {
    Input: React.lazy(() => Promise.resolve({ default: () => null })), // No specific input panel yet
    Params: React.lazy(() => Promise.resolve({ default: () => null })), // No specific params panel yet
    Results: React.lazy(() => Promise.resolve({ default: () => null })), // No specific results panel yet
    Stage: React.lazy(() =>
      import("./modules/gym/GymStage").then((m) => ({ default: m.GymStage })),
    ),
  },
  concepts: {
    Stage: React.lazy(() =>
      import("./modules/concepts/ConceptStage").then((m) => ({
        default: m.ConceptStage,
      })),
    ),
    Input: React.lazy(() => Promise.resolve({ default: () => null })),
    Params: React.lazy(() => Promise.resolve({ default: () => null })),
    Results: React.lazy(() => Promise.resolve({ default: () => null })),
  },
  tutor: {
    Stage: React.lazy(() =>
      import("./modules/tutor/TutorStage").then((m) => ({
        default: m.TutorStage,
      })),
    ),
    Input: React.lazy(() => Promise.resolve({ default: () => null })),
    Params: React.lazy(() => Promise.resolve({ default: () => null })),
    Results: React.lazy(() => Promise.resolve({ default: () => null })),
  },
};

/**
 * Hook to get module sections for rendering
 */
export function useMathLabSections() {
  const ctx = useMathLabContext();
  const { activeModule, isConsoleOpen, consoleHeight } = ctx;

  const moduleConfig = useMemo(
    () => getModuleConfig(activeModule),
    [activeModule],
  );
  const components = MODULE_COMPONENTS[activeModule];

  const inputSection = useMemo(() => {
    if (!components?.Input) return null;
    const InputComponent = components.Input;
    return (
      <React.Suspense
        fallback={
          <div className="h-20 animate-pulse bg-white/3 border border-white/5 rounded-2xl" />
        }
      >
        <InputComponent />
      </React.Suspense>
    );
  }, [components]);

  const paramsSection = useMemo(() => {
    if (!components?.Params) return null;
    const ParamsComponent = components.Params;
    return (
      <React.Suspense
        fallback={<div className="h-20 animate-pulse bg-white/5 rounded-xl" />}
      >
        <ParamsComponent />
      </React.Suspense>
    );
  }, [components]);

  const resultsSection = useMemo(() => {
    if (!components?.Results) return null;
    const ResultsComponent = components.Results;
    return (
      <React.Suspense
        fallback={<div className="h-20 animate-pulse bg-white/5 rounded-xl" />}
      >
        <ResultsComponent />
      </React.Suspense>
    );
  }, [components]);

  const stageSection = useMemo(() => {
    if (!components?.Stage) return null;
    const StageComponent = components.Stage;
    return (
      <React.Suspense fallback={<EliteLoader />}>
        <StageComponent
          consoleExpanded={isConsoleOpen}
          consoleHeight={consoleHeight}
          graphPlotterRef={ctx.graphPlotterRef}
          surfacePlotterRef={ctx.surfacePlotterRef}
        />
      </React.Suspense>
    );
  }, [
    components,
    isConsoleOpen,
    consoleHeight,
    ctx.graphPlotterRef,
    ctx.surfacePlotterRef,
  ]);

  return {
    inputSection,
    paramsSection,
    resultsSection,
    stageSection,
    moduleConfig,
  };
}

/**
 * Get all registered modules for tab rendering
 */
export function useRegisteredModules() {
  return useMemo(() => getAllModules(), []);
}
