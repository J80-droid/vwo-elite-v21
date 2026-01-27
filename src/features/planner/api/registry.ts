import { PlannerModuleConfig } from "@features/planner/types";
export type { PlannerModuleConfig };

// Internal registry storage
const modules: Record<string, PlannerModuleConfig> = {};

export const registerModule = (config: PlannerModuleConfig) => {
  modules[config.id] = config;
};

export const getModuleConfig = (id: string): PlannerModuleConfig => {
  return modules[id] || modules["tasks"]!;
};

export const getAllModules = (): PlannerModuleConfig[] => {
  // Return explicit order - Dashboard/Command Center first
  const order = [
    "dashboard",
    "schedule",
    "grades",
    "calendar",
    "homework",
    "exams",
    "pws",
    "tasks",
    "timeline",
    "analytics",
    "settings",
  ];
  return order
    .map((id) => modules[id])
    .filter((m): m is PlannerModuleConfig => !!m);
};

export const getModuleIds = (): string[] => {
  return Object.keys(modules);
};
