/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PsychologyGlobalSettings } from "@features/psychology/types";
import React, { createContext, ReactNode, useContext } from "react";

import { usePsychologyLabState } from "./usePsychologyLabState";

interface PsychologyLabContextType {
  activeModule: string;
  setActiveModule: (id: string) => void;
  globalSettings: PsychologyGlobalSettings;
  updateGlobalSettings: (settings: Partial<PsychologyGlobalSettings>) => void;
  moduleStates: Record<string, any>;
  setModuleState: <T>(
    moduleId: string,
    state: Partial<T> | ((prev: T) => Partial<T>),
  ) => void;
}

const PsychologyLabContext = createContext<PsychologyLabContextType | null>(
  null,
);

export const PsychologyLabProvider: React.FC<{
  children: ReactNode;
  initialModule?: string;
}> = ({ children, initialModule }) => {
  const state = usePsychologyLabState(initialModule);

  return (
    <PsychologyLabContext.Provider value={state}>
      {children}
    </PsychologyLabContext.Provider>
  );
};

export const usePsychologyLabContext = () => {
  const context = useContext(PsychologyLabContext);
  if (!context) {
    throw new Error(
      "usePsychologyLabContext must be used within a PsychologyLabProvider",
    );
  }
  return context;
};

// Helper hook for individual modules
export const useModuleState = <T,>(moduleId: string, initialState?: T) => {
  const { moduleStates, setModuleState } = usePsychologyLabContext();

  const state = (moduleStates[moduleId] as T) || initialState || ({} as T);

  const setState = (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setModuleState(moduleId, updates);
  };

  return [state, setState] as const;
};
