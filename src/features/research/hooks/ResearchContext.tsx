/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Research Lab Context
 *
 * React Context providing centralized state management for Research Lab modules.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface ResearchState {
  activeModule: string;
  isConsoleOpen: boolean;
  consoleHeight: number;
  researchData: any; // Flexible data store for modules
}

interface ResearchContextValue extends ResearchState {
  setActiveModule: (module: string) => void;
  setIsConsoleOpen: (isOpen: boolean) => void;
  setConsoleHeight: (height: number) => void;
  setResearchData: (data: any) => void;
  updateResearchData: (update: any) => void;
  saveResult: (data: any) => Promise<void>;
}

const ResearchContext = createContext<ResearchContextValue | null>(null);

export interface ResearchProviderProps {
  children: React.ReactNode;
  initialModule?: string;
}

// Imports
import { saveResearchResultSQL } from "@shared/api/sqliteService";

export const ResearchProvider: React.FC<ResearchProviderProps> = ({
  children,
  initialModule = "sources",
}) => {
  // State
  const [activeModule, setActiveModule] = useState<string>(initialModule);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(300);
  const [researchData, setResearchData] = useState<any>({});

  // Load initial data for module
  useEffect(() => {
    const loadModuleData = async () => {
      // Optional: Load history if needed. For now, we prefer a fresh slate per session or specific load logic.
      // This can be expanded to autofill previous sessions.
      /*
            const history = await getResearchResultsSQL(activeModule);
            if (history.length > 0) {
                setResearchData(prev => ({ ...prev, history }));
            }
            */
    };
    loadModuleData();
  }, [activeModule]);

  const updateResearchData = (update: any) => {
    setResearchData((prev: any) => {
      const newState = { ...prev, ...update };

      // Auto-save significant updates if they have content
      if (activeModule && Object.keys(update).length > 0) {
        // Debounce or selective save could be added here.
        // For now, we save explicitly when 'results' are generated, not every keystroke.
        // We'll leave the explicit save to the module components themselves via a new context method or hook,
        // OR we can save here if we identify a 'result' key.
      }
      return newState;
    });
  };

  // Explicit save function exposed to modules
  const saveResult = async (data: any) => {
    await saveResearchResultSQL(activeModule, data);
  };

  const value = useMemo(
    () => ({
      activeModule,
      setActiveModule,
      isConsoleOpen,
      setIsConsoleOpen,
      consoleHeight,
      setConsoleHeight,
      researchData,
      setResearchData,
      updateResearchData,
      saveResult, // Exposed for modules to call
    }),
    [activeModule, isConsoleOpen, consoleHeight, researchData],
  );

  return (
    <ResearchContext.Provider value={value}>
      {children}
    </ResearchContext.Provider>
  );
};

export const useResearchContext = (): ResearchContextValue => {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error(
      "useResearchContext must be used within a ResearchProvider",
    );
  }
  return context;
};
