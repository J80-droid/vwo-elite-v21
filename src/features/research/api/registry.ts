import { ResearchModuleConfig } from "@features/research/types";

const modules: Record<string, ResearchModuleConfig> = {};

export const registerModule = (config: ResearchModuleConfig) => {
  modules[config.id] = config;
};

export const getModuleConfig = (id: string): ResearchModuleConfig => {
  return modules[id] || modules["sources"]!;
};

export const getAllModules = (): ResearchModuleConfig[] => {
  const order = ["sources", "notes", "synthesis"];
  return order
    .map((id) => modules[id])
    .filter(Boolean) as ResearchModuleConfig[];
};

export const getModuleIds = (): string[] => {
  return Object.keys(modules);
};
