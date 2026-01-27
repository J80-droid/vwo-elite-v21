/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, ReactNode, useContext } from "react";

import { PhilosophyGlobalSettings } from "../types";
import { usePhilosophyLabState } from "./usePhilosophyLabState";

interface PhilosophyLabContextType {
  activeModule: string;
  setActiveModule: (id: string) => void;
  globalSettings: PhilosophyGlobalSettings;
  updateGlobalSettings: (settings: Partial<PhilosophyGlobalSettings>) => void;
  moduleStates: Record<string, any>;
  setModuleState: <T>(
    moduleId: string,
    state: Partial<T> | ((prev: T) => Partial<T>),
  ) => void;
}

const PhilosophyLabContext = createContext<PhilosophyLabContextType | null>(
  null,
);

export const PhilosophyLabProvider: React.FC<{
  children: ReactNode;
  initialModule?: string | undefined;
}> = ({ children, initialModule }) => {
  const state = usePhilosophyLabState(initialModule);

  return (
    <PhilosophyLabContext.Provider value={state}>
      {children}
    </PhilosophyLabContext.Provider>
  );
};

export const usePhilosophyLabContext = () => {
  const context = useContext(PhilosophyLabContext);
  if (!context) {
    throw new Error(
      "usePhilosophyLabContext must be used within a PhilosophyLabProvider",
    );
  }
  return context;
};

// Helper hook for individual modules
export const useModuleState = <T,>(moduleId: string, initialState?: T) => {
  const { moduleStates, setModuleState } = usePhilosophyLabContext();

  const storedState = moduleStates[moduleId] as T;
  const state = { ...(initialState || {}), ...(storedState || {}) } as T;

  const setState = (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setModuleState(moduleId, updates);
  };

  return [state, setState] as const;
};
