/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AppTheme } from "@features/settings/types";
import { useTranslations } from "@shared/hooks/useTranslations";
import React, { useEffect, useMemo, useState } from "react";

import { useSettingsContext } from "../hooks/SettingsContext";

const MODULE_COMPONENTS: Record<string, React.FC<any>> = {
  profile: React.lazy(() =>
    import("./tabs/ProfileTab").then((m) => ({ default: m.ProfileTab })),
  ),
  appearance: React.lazy(() =>
    import("./tabs/AppearanceTab").then((m) => ({ default: m.AppearanceTab })),
  ),
  ai: React.lazy(
    () =>
      import("./tabs/AIControlCenter").then((m) => ({
        default: m.AIControlCenter,
      })), // HMR Check
  ),
  prompts: React.lazy(() =>
    import("./tabs/PromptSettingsTab").then((m) => ({
      default: m.PromptSettingsTab,
    })),
  ),
  api: React.lazy(() =>
    import("./tabs/ApiConfigTab").then((m) => ({ default: m.ApiConfigTab })),
  ),
  focus: React.lazy(() =>
    import("./tabs/FocusTab").then((m) => ({ default: m.FocusTab })),
  ),
  data: React.lazy(() =>
    import("./tabs/DataTab").then((m) => ({ default: m.DataTab })),
  ),
  storage: React.lazy(() =>
    import("./tabs/StorageTab").then((m) => ({ default: m.StorageTab })),
  ),
  shortcuts: React.lazy(() =>
    import("./tabs/ShortcutsTab").then((m) => ({ default: m.ShortcutsTab })),
  ),
  architecture: React.lazy(() =>
    import("./modules/architecture/ArchitectureSettings").then((m) => ({
      default: m.ArchitectureSettings,
    })),
  ),
};

// Available themes for AppearanceTab
const THEMES: AppTheme[] = ["electric", "cyberpunk", "matrix", "gold", "rose"];

export const useSettingsContent = () => {
  const {
    activeModule,
    settings,
    updateSettings,
    exportBackup,
    importBackup,
    factoryReset,
  } = useSettingsContext();
  const { t } = useTranslations();

  // State for ApiConfigTab
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  // State for StorageTab
  const [storageUsage, setStorageUsage] = useState<{
    used: number;
    quota: number;
  } | null>(null);

  // Fetch storage usage on mount
  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        setStorageUsage({
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
        });
      });
    }
  }, []);

  const ActiveComponent = MODULE_COMPONENTS[activeModule];

  // Build props based on active module
  const moduleProps = useMemo(() => {
    const baseProps = { settings, updateSettings, t };

    switch (activeModule) {
      case "appearance":
        return { ...baseProps, themes: THEMES };
      case "api":
        return { ...baseProps, showApiKey, setShowApiKey };
      case "data":
        return { ...baseProps, exportBackup, importBackup, factoryReset };
      case "storage":
        return { storageUsage, t };
      default:
        return baseProps;
    }
  }, [
    activeModule,
    settings,
    updateSettings,
    t,
    showApiKey,
    storageUsage,
    exportBackup,
    importBackup,
    factoryReset,
  ]);

  return useMemo(() => {
    if (!ActiveComponent) {
      return {
        Stage: (
          <div className="p-8 text-center text-slate-500">
            Module '{activeModule}' not found
          </div>
        ),
      };
    }

    return {
      Stage: (
        <React.Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center p-20 animate-pulse text-slate-500">
              Loading Settings...
            </div>
          }
        >
          <ActiveComponent {...moduleProps} />
        </React.Suspense>
      ),
    };
  }, [ActiveComponent, activeModule, moduleProps]);
};
