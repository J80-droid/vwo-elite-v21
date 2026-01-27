import { useCallback, useState } from "react";

import { BiologyGlobalSettings, defaultBiologyGlobalSettings } from "../types";

export const useBiologyLabState = (initialModule: string = "genomics") => {
  const [activeModule, setActiveModule] = useState<string>(initialModule);
  const [globalSettings, setGlobalSettings] = useState<BiologyGlobalSettings>(
    defaultBiologyGlobalSettings,
  );

  // Generic module state storage
  const [moduleStates, setModuleStates] = useState<Record<string, unknown>>({});

  const updateGlobalSettings = useCallback(
    (updates: Partial<BiologyGlobalSettings>) => {
      setGlobalSettings((prev: BiologyGlobalSettings) => ({
        ...prev,
        ...updates,
      }));
    },
    [],
  );

  const setModuleState = useCallback(
    <T>(moduleId: string, updates: Partial<T> | ((prev: T) => Partial<T>)) => {
      setModuleStates((prev) => {
        const current = (prev[moduleId] as T) || {};
        const next =
          typeof updates === "function"
            ? (updates as (prev: T) => Partial<T>)(current as T)
            : updates;

        return {
          ...prev,
          [moduleId]: { ...current, ...next },
        };
      });
    },
    [],
  );

  const incrementMastery = useCallback(
    (
      moduleId: string,
      points: number,
      bloomLevel?: keyof BiologyGlobalSettings["mastery"]["bloomLevels"],
    ) => {
      setGlobalSettings((prev) => {
        const newMastery = { ...prev.mastery };

        // Increment module specific mastery
        if (moduleId in newMastery) {
          const key = moduleId as keyof typeof newMastery;
          // @ts-expect-error - dynamic key access on mastery object
          newMastery[key] = Math.min(100, (newMastery[key] as number) + points);
        }

        // Increment Bloom level mastery if provided
        if (bloomLevel && bloomLevel in newMastery.bloomLevels) {
          newMastery.bloomLevels[bloomLevel] = Math.min(
            100,
            newMastery.bloomLevels[bloomLevel] + points / 2,
          );
        }

        return { ...prev, mastery: newMastery };
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
    incrementMastery,
  };
};
