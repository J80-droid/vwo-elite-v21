import { PhilosophyModuleConfig } from "../types";
import {
  analysisConfig,
  battleConfig,
  conceptMatrixConfig,
  dialogueConfig,
  ethicsConfig,
  examConfig,
  logicConfig,
  scienceConfig,
  societyConfig,
  technoHumanConfig,
} from "../ui/modules";

const modules: Record<string, PhilosophyModuleConfig> = {};

export const registerModule = (config: PhilosophyModuleConfig) => {
  modules[config.id] = config;
};

export const getModuleConfig = (id: string): PhilosophyModuleConfig => {
  return modules[id] || modules["dialogue"]!;
};

export const getAllModules = (): PhilosophyModuleConfig[] => {
  return Object.values(modules);
};

export const getModuleIds = (): string[] => {
  return Object.keys(modules);
};

// Initial registration
registerModule(dialogueConfig);
registerModule(logicConfig);
registerModule(ethicsConfig);
registerModule(conceptMatrixConfig);
registerModule(analysisConfig);
registerModule(examConfig);
registerModule(technoHumanConfig);
registerModule(battleConfig);
registerModule(scienceConfig);
registerModule(societyConfig);
