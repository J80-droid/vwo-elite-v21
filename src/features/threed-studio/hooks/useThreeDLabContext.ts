import { useContext } from "react";

import { ThreeDLabContext } from "./ThreeDLabContextInternal";

export const useThreeDLabContext = () => {
  const context = useContext(ThreeDLabContext);
  if (!context) {
    throw new Error(
      "useThreeDLabContext must be used within a ThreeDLabProvider",
    );
  }
  return context;
};

/**
 * Helper hook for individual modules to easily access their own state
 * @param moduleId The unique identifier for the module
 * @param initialState The initial state if none exists
 */
export function useModuleState<T>(moduleId: string, initialState: T) {
  const { getModuleState, setModuleState } = useThreeDLabContext();
  const state = getModuleState(moduleId, initialState) as T;

  const setState = (updater: ((prev: T) => T) | Partial<T>) => {
    setModuleState(moduleId, updater);
  };

  return [state, setState] as const;
}
