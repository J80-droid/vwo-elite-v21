/* eslint-disable react-refresh/only-export-components */
import type { UserSettings } from "@features/settings/types";
import { useSettings } from "@shared/hooks/useSettings";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

interface SettingsContextType {
  // UI State
  activeModule: string;
  setActiveModule: (module: string) => void;
  isConsoleOpen: boolean;
  setIsConsoleOpen: (isOpen: boolean) => void;
  consoleHeight: number;
  setConsoleHeight: (height: number) => void;

  // Data State (from useSettings)
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  exportBackup: () => void;
  importBackup: () => void;
  factoryReset: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { module } = useParams<{ module?: string }>();
  const navigate = useNavigate();

  // Derive activeModule from URL param, fallback to "profile"
  const activeModule = module || "profile";

  // Navigate to new module when setActiveModule is called
  const setActiveModule = useCallback(
    (newModule: string) => {
      navigate(`/settings/${newModule}`, { replace: true });
    },
    [navigate],
  );

  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(200);

  const { settings, updateSettings, exportBackup, importBackup, factoryReset } =
    useSettings();

  return (
    <SettingsContext.Provider
      value={{
        activeModule,
        setActiveModule,
        isConsoleOpen,
        setIsConsoleOpen,
        consoleHeight,
        setConsoleHeight,
        settings,
        updateSettings,
        exportBackup,
        importBackup,
        factoryReset,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider",
    );
  }
  return context;
};
