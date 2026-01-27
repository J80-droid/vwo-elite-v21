/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, ReactNode, useContext } from "react";

import { ChemistryGlobalSettings } from "../types";
import { useChemistryLabState } from "./useChemistryLabState";

interface ChemistryLabContextType {
  activeModule: string;
  setActiveModule: (id: string) => void;
  globalSettings: ChemistryGlobalSettings;
  updateGlobalSettings: (settings: Partial<ChemistryGlobalSettings>) => void;
  moduleStates: Record<string, any>;
  setModuleState: <T>(
    moduleId: string,
    state: Partial<T> | ((prev: T) => Partial<T>),
  ) => void;

  // UI State
  isConsoleOpen: boolean;
  setConsoleOpen: (isOpen: boolean) => void;
  consoleHeight: number;
  setConsoleHeight: (height: number) => void;
}

const ChemistryLabContext = createContext<ChemistryLabContextType | null>(null);

export const ChemistryLabProvider: React.FC<{
  children: ReactNode;
  initialModule?: string;
}> = ({ children, initialModule }) => {
  const state = useChemistryLabState(initialModule);

  return (
    <ChemistryLabContext.Provider value={state}>
      {children}
    </ChemistryLabContext.Provider>
  );
};

export const useChemistryLabContext = () => {
  const context = useContext(ChemistryLabContext);
  if (!context) {
    throw new Error(
      "useChemistryLabContext must be used within a ChemistryLabProvider",
    );
  }
  return context;
};

// Helper hook for individual modules to access their own state easily
export const useModuleState = <T,>(moduleId: string, initialState?: T) => {
  const { moduleStates, setModuleState } = useChemistryLabContext();

  // Initialize if empty (this is a simple lazy init, might need useEffect for robustness if initial state is complex)
  // Actually, registry should provide initial state, but this is a safe fallback
  const state = (moduleStates[moduleId] as T) || initialState || ({} as T);

  const setState = (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setModuleState(moduleId, updates);
  };

  return [state, setState] as const;
};
