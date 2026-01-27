/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic lab context hooks */
import { useContext } from "react";

import type { MathLabContextValue } from "../types";
import { MathLabContext } from "./MathLabContextInstance";

/**
 * Hook to access MathLab state from any module component
 * @throws Error if used outside of MathLabProvider
 */
export const useMathLabContext = (): MathLabContextValue => {
  const context = useContext(MathLabContext);

  if (!context) {
    throw new Error(
      "useMathLabContext must be used within a MathLabProvider. " +
        "Wrap your MathLab component tree with <MathLabProvider>.",
    );
  }

  return context;
};

/**
 * Optional hook that returns null instead of throwing when outside provider
 * Useful for components that may or may not be inside MathLab
 */
export const useMathLabContextOptional = (): MathLabContextValue | null => {
  return useContext(MathLabContext);
};

// --- HELPER HOOKS FOR MODULAR STATE ---

/**
 * Hook to access specific state for a module.
 * @param moduleId The ID of the module (e.g., 'vectors', '3d')
 */
export function useModuleState<T = any>(
  moduleId: string,
): [T, (update: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const { moduleStates, setModuleState } = useMathLabContext();

  const state = (moduleStates[moduleId] || {}) as T;

  const setState = (update: Partial<T> | ((prev: T) => Partial<T>)) => {
    setModuleState(moduleId, update);
  };

  return [state, setState];
}

/**
 * Hook to access global settings
 */
export function useGlobalSettings() {
  const { globalSettings, setGlobalSettings } = useMathLabContext();
  return [globalSettings, setGlobalSettings] as const;
}
