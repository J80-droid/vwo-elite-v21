/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";

import {
  ChemistryGlobalSettings,
  defaultChemistryGlobalSettings,
} from "../types";

export const useChemistryLabState = (initialModule: string = "visualizer") => {
  const [activeModule, setActiveModule] = useState<string>(initialModule);
  const [globalSettings, setGlobalSettings] = useState<ChemistryGlobalSettings>(
    defaultChemistryGlobalSettings,
  );

  // UI State
  const [isConsoleOpen, setConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(300);

  // Generic store for module-specific state
  const [moduleStates, setModuleStates] = useState<Record<string, any>>({});

  const setModuleState = useCallback(
    <T>(moduleId: string, newState: Partial<T> | ((prev: T) => Partial<T>)) => {
      setModuleStates((prev) => {
        const currentModuleState = prev[moduleId] || {};
        const updates =
          typeof newState === "function"
            ? (newState as any)(currentModuleState)
            : newState;

        return {
          ...prev,
          [moduleId]: {
            ...currentModuleState,
            ...updates,
          },
        };
      });
    },
    [],
  );

  const updateGlobalSettings = useCallback(
    (updates: Partial<ChemistryGlobalSettings>) => {
      setGlobalSettings((prev: ChemistryGlobalSettings) => ({
        ...prev,
        ...updates,
      }));
    },
    [],
  );

  return {
    activeModule,
    setActiveModule,
    globalSettings,
    updateGlobalSettings,
    moduleStates,
    setModuleState,
    // UI Exports
    isConsoleOpen,
    setConsoleOpen,
    consoleHeight,
    setConsoleHeight,
  };
};
