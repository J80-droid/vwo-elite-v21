/* usePhysicsLabState - Centralized State Management Hook */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { getAllModules } from "../api/registry";
import {
  defaultPhysicsGlobalSettings,
  PhysicsGlobalSettings,
  PhysicsModule,
  QuizQuestion,
  TFunction,
  UsePhysicsLabStateReturn,
} from "../types";

export function usePhysicsLabState(
  initialModule?: PhysicsModule,
): UsePhysicsLabStateReturn {
  const { t } = useTranslation();

  // --- Core State ---
  const [activeModule, setActiveModule] = useState<PhysicsModule>(
    initialModule || "spring",
  );
  const [globalSettings, setGlobalSettings] = useState<PhysicsGlobalSettings>(
    defaultPhysicsGlobalSettings,
  );

  // --- UI State ---
  const [isConsoleOpen, setConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(300);

  // --- Modular State Initialization ---
  // Initialize with defaults from registry
  const [moduleStates, setModuleStates] = useState<Record<string, Record<string, unknown>>>(() => {
    const states: Record<string, Record<string, unknown>> = {};
    getAllModules().forEach((mod) => {
      if (mod.initialState) {
        states[mod.id] = { ...(mod.initialState as Record<string, unknown>) };
      }
    });
    return states;
  });

  const setModuleState = useCallback(
    (
      moduleId: string,
      stateUpdate:
        | Record<string, unknown>
        | ((prev: Record<string, unknown>) => Record<string, unknown>),
    ) => {
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

  // Helper: setParameter (proxy for setModuleState of active module)
  const setParameter = useCallback(
    (key: string, value: unknown) => {
      setModuleState(activeModule, { [key]: value });
    },
    [activeModule, setModuleState],
  );

  const state = moduleStates[activeModule] || {};

  // --- Quiz State ---
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);

  const startQuiz = useCallback((quiz: QuizQuestion) => {
    setActiveQuiz(quiz);
  }, []);

  const endQuiz = useCallback((success: boolean) => {
    // Logic to unlock module if passed?
    // For now just close it.
    if (success) setActiveQuiz(null);
  }, []);

  return {
    activeModule,
    setActiveModule,
    state,
    setParameter,
    t: t as unknown as TFunction,
    globalSettings,
    setGlobalSettings,
    moduleStates,
    setModuleState: setModuleState as UsePhysicsLabStateReturn["setModuleState"],
    // UI Exports
    isConsoleOpen,
    setConsoleOpen,
    consoleHeight,
    setConsoleHeight,
    // Quiz Exports
    activeQuiz,
    startQuiz,
    endQuiz,
  };
}
