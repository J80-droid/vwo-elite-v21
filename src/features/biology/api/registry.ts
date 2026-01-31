import { BiologyModuleConfig } from "../types";
import { gymConfig } from "../ui/gym/config";
import { ecologyConfig } from "../ui/modules/ecology/config";
import { genomicsConfig } from "../ui/modules/genomics/config";
import { microscopyConfig } from "../ui/modules/microscopy/config";
import { physiologyConfig } from "../ui/modules/physiology/config";
import { proteinConfig } from "../ui/modules/protein/config";

const modules: Record<string, BiologyModuleConfig> = {};

export const registerModule = (config: BiologyModuleConfig) => {
  modules[config.id] = config;
};

export const getModuleConfig = (id: string): BiologyModuleConfig => {
  return (modules[id] || modules["genomics"])!;
};

export const getAllModules = (): BiologyModuleConfig[] => {
  return Object.values(modules);
};

export const getModuleIds = (): string[] => {
  return Object.keys(modules);
};

// Initial registration
registerModule(genomicsConfig);
registerModule(microscopyConfig);
registerModule(ecologyConfig);
registerModule(physiologyConfig);
registerModule(proteinConfig);
registerModule(gymConfig);
