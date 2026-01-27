/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";

import {
  defaultPhilosophyGlobalSettings,
  PhilosophyGlobalSettings,
} from "../types";

export const usePhilosophyLabState = (initialModule: string = "dialogue") => {
  const [activeModule, setActiveModule] = useState<string>(initialModule);
  const [globalSettings, setGlobalSettings] =
    useState<PhilosophyGlobalSettings>(defaultPhilosophyGlobalSettings);

  // Generic module state storage with Lazy Initialization (Persistence)
  const [moduleStates, setModuleStates] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem("philosophy_lab_progress");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load Philosophy Lab progress:", e);
      return {};
    }
  });

  // Auto-Save Effect
  useEffect(() => {
    try {
      localStorage.setItem(
        "philosophy_lab_progress",
        JSON.stringify(moduleStates),
      );
    } catch (e) {
      console.error("Failed to save Philosophy Lab progress:", e);
    }
  }, [moduleStates]);

  const updateGlobalSettings = useCallback(
    (updates: Partial<PhilosophyGlobalSettings>) => {
      setGlobalSettings((prev: PhilosophyGlobalSettings) => ({
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
