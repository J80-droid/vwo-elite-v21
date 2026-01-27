/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BrainstormGlobalSettings,
  BrainstormModule,
  defaultBrainstormGlobalSettings,
} from "@features/brainstorm/types";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface BrainstormLabContextType {
  // Active module
  activeModule: BrainstormModule;
  setActiveModule: (module: BrainstormModule) => void;

  // UI State
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Global settings
  globalSettings: BrainstormGlobalSettings;
  updateGlobalSettings: (settings: Partial<BrainstormGlobalSettings>) => void;

  // Module-specific states
  moduleStates: Record<string, any>;
  setModuleState: <T>(
    moduleId: string,
    state: Partial<T> | ((prev: T) => Partial<T>),
  ) => void;
}

const BrainstormLabContext = createContext<
  BrainstormLabContextType | undefined
>(undefined);

export const BrainstormLabProvider: React.FC<{
  children: ReactNode;
  initialModule?: BrainstormModule;
}> = ({ children, initialModule = "" }) => {
  const [activeModule, setActiveModule] =
    useState<BrainstormModule>(initialModule);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSettings, setGlobalSettings] =
    useState<BrainstormGlobalSettings>(defaultBrainstormGlobalSettings);
  const [moduleStates, setModuleStates] = useState<Record<string, any>>({});

  const updateGlobalSettings = useCallback(
    (settings: Partial<BrainstormGlobalSettings>) => {
      setGlobalSettings((prev) => ({ ...prev, ...settings }));
    },
    [],
  );

  const setModuleState = useCallback(
    <T,>(moduleId: string, update: Partial<T> | ((prev: T) => Partial<T>)) => {
      setModuleStates((prev) => {
        const currentState = (prev[moduleId] || {}) as T;
        const newPartial =
          typeof update === "function" ? update(currentState) : update;
        return {
          ...prev,
          [moduleId]: { ...currentState, ...newPartial },
        };
      });
    },
    [],
  );

  return (
    <BrainstormLabContext.Provider
      value={{
        activeModule,
        setActiveModule,
        isSidebarCollapsed,
        setSidebarCollapsed,
        globalSettings,
        updateGlobalSettings,
        moduleStates,
        setModuleState,
      }}
    >
      {children}
    </BrainstormLabContext.Provider>
  );
};

export const useBrainstormLabContext = () => {
  const context = useContext(BrainstormLabContext);
  if (!context) {
    throw new Error(
      "useBrainstormLabContext must be used within a BrainstormLabProvider",
    );
  }
  return context;
};

/**
 * Hook to access specific state for a module.
 * @param moduleId The ID of the module (e.g., 'mindmap', 'knowledge')
 * @param initialState Optional initial state for the module
 */
export function useModuleState<T = any>(
  moduleId: string,
  initialState?: T,
): [T, (update: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const { moduleStates, setModuleState } = useBrainstormLabContext();

  const state = (moduleStates[moduleId] as T) || initialState || ({} as T);

  const setState = (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setModuleState(moduleId, updates);
  };

  return [state, setState] as const;
}
