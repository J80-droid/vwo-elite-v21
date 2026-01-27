import { useCallback, useContext } from "react";

import type { PhysicsLabContextValue } from "../types";
import { PhysicsLabContext } from "./PhysicsLabContextInstance";

export type { PhysicsLabContextValue };

/**
 * Hook to access PhysicsLab state from any module component
 */
export const usePhysicsLabContext = (): PhysicsLabContextValue => {
  const context = useContext(PhysicsLabContext);
  if (!context) {
    throw new Error(
      "usePhysicsLabContext must be used within a PhysicsLabProvider",
    );
  }
  return context;
};

/**
 * Hook to access PhysicsLab state optionally (doesn't throw if null)
 */
export const useOptionalPhysicsLabContext = (): PhysicsLabContextValue | null => {
  return useContext(PhysicsLabContext);
};

/**
 * Hook to access specific state for a module.
 */
export function useModuleState<T = Record<string, unknown>>(
  moduleId: string,
): [T, (update: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const { moduleStates, setModuleState } = usePhysicsLabContext();
  const state = (moduleStates[moduleId] || {}) as T;

  const setState = useCallback(
    (update: Partial<T> | ((prev: T) => Partial<T>)) => {
      setModuleState(moduleId, update as unknown as Record<string, unknown>);
    },
    [moduleId, setModuleState],
  );

  return [state, setState];
}
