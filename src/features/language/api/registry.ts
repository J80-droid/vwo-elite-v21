import { LanguageModuleConfig } from "../types";
import {
  idiomsConfig,
  presentationConfig,
  scenariosConfig,
  sjtConfig,
} from "../ui/modules";

// Internal registry storage
const modules: Record<string, LanguageModuleConfig> = {};

/**
 * Register a module configuration
 */
const registerModule = (config: LanguageModuleConfig): void => {
  if (modules[config.id]) {
    console.warn(
      `[LanguageLab Registry] Module "${config.id}" is already registered. Overwriting.`,
    );
  }
  modules[config.id] = config;
};

/**
 * Get all registered modules
 */
export const getAllModules = (): LanguageModuleConfig[] => {
  return Object.values(modules);
};

// Initial registration
registerModule(scenariosConfig);
registerModule(idiomsConfig);
registerModule(sjtConfig);
registerModule(presentationConfig);
