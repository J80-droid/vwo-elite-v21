import { ThreeDModuleConfig } from "../types";

const modules: Record<string, ThreeDModuleConfig> = {};

export const registerModule = (config: ThreeDModuleConfig) => {
  modules[config.id] = config;
};

export const getModuleConfig = (
  id: string | null | undefined,
): ThreeDModuleConfig | undefined => {
  if (!id) return undefined;
  return modules[id];
};

export const getAllModules = (): ThreeDModuleConfig[] => {
  // Return modules in a specific preferred order
  const order = [
    "spatial",
    "stereo",
    "slicer",
    "build",
    "projection",
    "construction",
    "cross_section",
  ];
  return order
    .map((id) => modules[id])
    .filter((m): m is ThreeDModuleConfig => !!m);
};

export const getModuleIds = (): string[] => {
  return Object.keys(modules);
};
