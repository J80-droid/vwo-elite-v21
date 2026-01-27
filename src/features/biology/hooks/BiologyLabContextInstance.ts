import { createContext } from "react";

import { BiologyGlobalSettings } from "../types";

export interface BiologyLabContextType {
  activeModule: string;
  setActiveModule: (id: string) => void;
  globalSettings: BiologyGlobalSettings;
  updateGlobalSettings: (settings: Partial<BiologyGlobalSettings>) => void;
  moduleStates: Record<string, unknown>;
  setModuleState: <T>(
    moduleId: string,
    state: Partial<T> | ((prev: T) => Partial<T>),
  ) => void;
  incrementMastery: (
    moduleId: string,
    points: number,
    bloomLevel?: keyof BiologyGlobalSettings["mastery"]["bloomLevels"],
  ) => void;
}

export const BiologyLabContext = createContext<BiologyLabContextType | null>(
  null,
);
