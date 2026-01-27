import { createContext } from "react";

import { ThreeDGlobalSettings } from "../types";

export interface ThreeDLabContextType {
  activeModule: string | null;
  setActiveModule: (id: string | null) => void;
  settings: ThreeDGlobalSettings;
  updateSettings: (settings: Partial<ThreeDGlobalSettings>) => void;
  setModuleState: (moduleId: string, state: unknown) => void;
  getModuleState: (moduleId: string, defaultValue?: unknown) => unknown;
}

export const ThreeDLabContext = createContext<ThreeDLabContextType | null>(
  null,
);
