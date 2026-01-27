/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";

import { ThreeDGlobalSettings } from "../types";

export const useThreeDLabState = (initialModule: string | null = null) => {
  const [activeModule, setActiveModuleState] = useState<string | null>(
    initialModule,
  );

  // Global settings for the 3D environment
  const [settings, setSettings] = useState<ThreeDGlobalSettings>({
    gridEnabled: true,
    axesEnabled: true,
    highPerformance: true,
  });

  // Per-module state storage
  const [moduleStates, setModuleStates] = useState<Record<string, any>>({});

  const setActiveModule = useCallback((moduleId: string | null) => {
    setActiveModuleState(moduleId);
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<ThreeDGlobalSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [],
  );

  const setModuleState = useCallback(
    (moduleId: string, newStateOrUpdater: any) => {
      setModuleStates((prev) => {
        const current = prev[moduleId] || {};
        const next =
          typeof newStateOrUpdater === "function"
            ? newStateOrUpdater(current)
            : newStateOrUpdater;

        return {
          ...prev,
          [moduleId]: { ...current, ...next },
        };
      });
    },
    [],
  );

  const getModuleState = useCallback(
    (moduleId: string, defaultValue?: any) => {
      return moduleStates[moduleId] || defaultValue || {};
    },
    [moduleStates],
  );

  return {
    activeModule,
    setActiveModule,
    settings,
    updateSettings,
    moduleStates,
    setModuleState,
    getModuleState,
  };
};
