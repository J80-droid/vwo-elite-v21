import { useContext, useMemo } from "react";

import { BiologyLabContext } from "./BiologyLabContextInstance";

export const useBiologyLabContext = () => {
  const context = useContext(BiologyLabContext);
  if (!context) {
    throw new Error(
      "useBiologyLabContext must be used within a BiologyLabProvider",
    );
  }
  return context;
};

// Helper hook for individual modules
export const useModuleState = <T>(moduleId: string, initialState?: T) => {
  const { moduleStates, setModuleState } = useBiologyLabContext();

  // Use useMemo to ensure we have a full state object even if stored state is partial
  const state = useMemo(
    () =>
      ({
        ...(initialState || {}),
        ...(moduleStates[moduleId] || {}),
      }) as T,
    [moduleStates, moduleId, initialState],
  );

  const setState = (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setModuleState(moduleId, updates);
  };

  return [state, setState] as const;
};
