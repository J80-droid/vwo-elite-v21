/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  defaultPsychologyGlobalSettings,
  PsychologyGlobalSettings,
} from "@features/psychology/types";
import { useCallback, useState } from "react";

export const usePsychologyLabState = (initialModule: string = "cognition") => {
  const [activeModule, setActiveModule] = useState<string>(initialModule);
  const [globalSettings, setGlobalSettings] =
    useState<PsychologyGlobalSettings>(defaultPsychologyGlobalSettings);

  // Generic module state storage
  const [moduleStates, setModuleStates] = useState<Record<string, any>>({});

  const updateGlobalSettings = useCallback(
    (updates: Partial<PsychologyGlobalSettings>) => {
      setGlobalSettings((prev: PsychologyGlobalSettings) => ({
        ...prev,
        ...updates,
      }));
    },
    [],
  );

  const setModuleState = useCallback(
    <T>(moduleId: string, updates: Partial<T> | ((prev: T) => Partial<T>)) => {
      setModuleStates((prev) => {
        const current = prev[moduleId] || {};
        const next =
          typeof updates === "function" ? (updates as any)(current) : updates;

        return {
          ...prev,
          [moduleId]: { ...current, ...next },
        };
      });
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
  };
};
