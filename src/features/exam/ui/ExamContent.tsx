import { Brain, FileText } from "lucide-react";
import React, { useMemo } from "react";

import { useExamContext } from "../hooks/ExamContext";
import { DashboardPlaceholder } from "./components/DashboardPlaceholder";

// --- TYPES ---
type ModuleConfig = {
  Input: React.ComponentType | React.LazyExoticComponent<React.ComponentType>;
  Params: React.ComponentType | React.LazyExoticComponent<React.ComponentType>;
  Stage: React.ComponentType | React.LazyExoticComponent<React.ComponentType>;
  Results: React.ComponentType | React.LazyExoticComponent<React.ComponentType>;
};

// Helper to create a lazy component that renders nothing
const NullLazy = React.lazy(() => Promise.resolve({ default: () => null }));

// --- PLACEHOLDERS ---
const TrainerPlaceholder: ModuleConfig = {
  Input: NullLazy,
  Params: NullLazy,
  Stage: () => (
    <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-slate-600">
      <Brain size={48} className="opacity-20" />
      <span className="font-bold uppercase tracking-widest opacity-50">
        Knowledge Trainer Module
      </span>
    </div>
  ),
  Results: NullLazy,
};

const ResultsPlaceholder: ModuleConfig = {
  Input: NullLazy,
  Params: NullLazy,
  Stage: () => (
    <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-slate-600">
      <FileText size={48} className="opacity-20" />
      <span className="font-bold uppercase tracking-widest opacity-50">
        Performance Analytics & Results
      </span>
    </div>
  ),
  Results: NullLazy,
};

const DashboardWrapper: ModuleConfig = {
  Input: NullLazy,
  Params: NullLazy,
  Stage: DashboardPlaceholder,
  Results: NullLazy,
};

// --- REGISTRY ---
const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  dashboard: DashboardWrapper,
  trainer: TrainerPlaceholder,
  results: ResultsPlaceholder,
  quiz: {
    Input: NullLazy,
    Params: NullLazy,
    Stage: React.lazy(() =>
      import("./modules/quiz").then((m) => ({ default: m.QuizStage })),
    ),
    Results: NullLazy,
  },
  simulator: {
    Input: NullLazy,
    Params: NullLazy,
    Stage: React.lazy(() =>
      import("./modules/simulator").then((m) => ({
        default: m.SimulatorStage,
      })),
    ),
    Results: NullLazy,
  },
};

export const useExamContent = () => {
  const { activeModule } = useExamContext();

  return useMemo(() => {
    const config = MODULE_REGISTRY[activeModule] || MODULE_REGISTRY.dashboard;

    if (!config) {
      return { Input: null, Params: null, Stage: null, Results: null };
    }

    return {
      Input:
        config.Input === NullLazy ? null : (
          <React.Suspense
            fallback={
              <div className="h-20 animate-pulse bg-white/5 rounded-lg" />
            }
          >
            <config.Input />
          </React.Suspense>
        ),
      Params:
        config.Params === NullLazy ? null : (
          <React.Suspense
            fallback={
              <div className="h-10 animate-pulse bg-white/5 rounded-lg" />
            }
          >
            <config.Params />
          </React.Suspense>
        ),
      Stage: (
        <React.Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-indigo-500 font-mono text-[10px] uppercase tracking-[0.2em] animate-pulse h-full">
              Loading Component...
            </div>
          }
        >
          <config.Stage />
        </React.Suspense>
      ),
      Results:
        config.Results === NullLazy ? null : (
          <React.Suspense
            fallback={
              <div className="h-10 animate-pulse bg-white/5 rounded-lg" />
            }
          >
            <config.Results />
          </React.Suspense>
        ),
    };
  }, [activeModule]);
};
