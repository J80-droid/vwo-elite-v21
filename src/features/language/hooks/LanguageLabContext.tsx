/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  defaultLanguageGlobalSettings,
  LanguageGlobalSettings,
  LanguageModule,
} from "@features/language/types";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface LanguageLabContextType {
  // Active Language
  activeLanguage: string | null;
  setActiveLanguage: (lang: string | null) => void;

  // Active module
  activeModule: LanguageModule;
  setActiveModule: (module: LanguageModule) => void;

  // Global settings
  globalSettings: LanguageGlobalSettings;
  updateGlobalSettings: (settings: Partial<LanguageGlobalSettings>) => void;

  // Module-specific states
  moduleStates: Record<string, any>;
  setModuleState: <T>(
    moduleId: string,
    state: Partial<T> | ((prev: T) => Partial<T>),
  ) => void;
}

const LanguageLabContext = createContext<LanguageLabContextType | undefined>(
  undefined,
);

interface LanguageLabProviderProps {
  children: ReactNode;
  initialModule?: LanguageModule;
  initialLanguage?: string | null;
}

export const LanguageLabProvider: React.FC<LanguageLabProviderProps> = ({
  children,
  initialModule = "",
  initialLanguage = null,
}) => {
  const [activeLanguage, setActiveLanguage] = useState<string | null>(
    initialLanguage,
  );
  const [activeModule, setActiveModule] =
    useState<LanguageModule>(initialModule);
  const [globalSettings, setGlobalSettings] = useState<LanguageGlobalSettings>(
    defaultLanguageGlobalSettings,
  );
  const [moduleStates, setModuleStates] = useState<Record<string, any>>({});

  const updateGlobalSettings = useCallback(
    (settings: Partial<LanguageGlobalSettings>) => {
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
    <LanguageLabContext.Provider
      value={{
        activeLanguage,
        setActiveLanguage,
        activeModule,
        setActiveModule,
        globalSettings,
        updateGlobalSettings,
        moduleStates,
        setModuleState,
      }}
    >
      {children}
    </LanguageLabContext.Provider>
  );
};

export const useLanguageLabContext = () => {
  const context = useContext(LanguageLabContext);
  if (!context) {
    throw new Error(
      "useLanguageLabContext must be used within a LanguageLabProvider",
    );
  }
  return context;
};

/**
 * Hook to access specific state for a module.
 * @param moduleId The ID of the module (e.g., 'scenarios', 'idioms')
 * @param initialState Optional initial state for the module
 */
export function useModuleState<T = any>(
  moduleId: string,
  initialState?: T,
): [T, (update: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const { moduleStates, setModuleState } = useLanguageLabContext();

  const state = (moduleStates[moduleId] as T) || initialState || ({} as T);

  const setState = (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setModuleState(moduleId, updates);
  };

  return [state, setState] as const;
}
