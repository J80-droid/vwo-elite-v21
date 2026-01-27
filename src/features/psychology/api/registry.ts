import { PsychologyModuleConfig } from "../types";
import { cognitionConfig } from "../ui/modules/cognition/config";
import { personalityConfig } from "../ui/modules/personality/config";
import { socialConfig } from "../ui/modules/social/config";

const modules: Record<string, PsychologyModuleConfig> = {};

export const registerModule = (config: PsychologyModuleConfig) => {
  modules[config.id] = config;
};

export const getModuleConfig = (id: string): PsychologyModuleConfig => {
  return modules[id] || modules["cognition"]!;
};

export const getAllModules = (): PsychologyModuleConfig[] => {
  return Object.values(modules);
};

export const getModuleIds = (): string[] => {
  return Object.keys(modules);
};

// Initial registration
registerModule(cognitionConfig);
registerModule(socialConfig);
registerModule(personalityConfig);
