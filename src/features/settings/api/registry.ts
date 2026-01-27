import { SettingsModuleConfig } from "../types";

const modules: Record<string, SettingsModuleConfig> = {};

export const registerModule = (config: SettingsModuleConfig) => {
  modules[config.id] = config;
};

export const getModuleConfig = (id: string): SettingsModuleConfig => {
  return modules[id] || modules["profile"]!;
};

export const getAllModules = (): SettingsModuleConfig[] => {
  // Explicit order for settings
  const order = [
    "profile",
    "appearance",
    "ai",
    "prompts",
    "api",
    "focus",
    "data",
    "storage",
    "shortcuts",
    "architecture",
  ];
  return order
    .map((id) => modules[id])
    .filter(Boolean) as SettingsModuleConfig[];
};

export const getModuleIds = (): string[] => {
  return Object.keys(modules);
};
