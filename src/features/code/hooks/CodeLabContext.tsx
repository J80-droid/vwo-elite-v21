/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CodeGlobalSettings,
  CodeModule,
  defaultCodeGlobalSettings,
} from "@features/code/types";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface CodeLabContextType {
  // Active module
  activeModule: CodeModule;
  setActiveModule: (module: CodeModule) => void;

  // UI State
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Global settings
  globalSettings: CodeGlobalSettings;
  updateGlobalSettings: (settings: Partial<CodeGlobalSettings>) => void;

  // Module-specific states
  moduleStates: Record<string, any>;
  setModuleState: <T>(
    moduleId: string,
    state: Partial<T> | ((prev: T) => Partial<T>),
  ) => void;
}

const CodeLabContext = createContext<CodeLabContextType | undefined>(undefined);

export const CodeLabProvider: React.FC<{
  children: ReactNode;
  initialModule?: CodeModule;
}> = ({ children, initialModule = "" }) => {
  const [activeModule, setActiveModule] = useState<CodeModule>(initialModule);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<CodeGlobalSettings>(
    defaultCodeGlobalSettings,
  );
  const [moduleStates, setModuleStates] = useState<Record<string, any>>({});

  const updateGlobalSettings = useCallback(
    (settings: Partial<CodeGlobalSettings>) => {
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
    <CodeLabContext.Provider
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
    </CodeLabContext.Provider>
  );
};

export const useCodeLabContext = () => {
  const context = useContext(CodeLabContext);
  if (!context) {
    throw new Error("useCodeLabContext must be used within a CodeLabProvider");
  }
  return context;
};

/**
 * Hook to access specific state for a module.
 * @param moduleId The ID of the module (e.g., 'python', 'web', 'sql')
 * @param initialState Optional initial state for the module
 */
export function useModuleState<T = any>(
  moduleId: string,
  initialState?: T,
): [T, (update: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const { moduleStates, setModuleState } = useCodeLabContext();

  const state = (moduleStates[moduleId] as T) || initialState || ({} as T);

  const setState = (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setModuleState(moduleId, updates);
  };

  return [state, setState] as const;
}
