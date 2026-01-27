import { CodeModuleConfig } from "@features/code/types";

// Internal registry storage
const modules: Record<string, CodeModuleConfig> = {};

/**
 * Register a module configuration
 */
export const registerModule = (config: CodeModuleConfig): void => {
  if (modules[config.id]) {
    console.warn(
      `[CodeLab Registry] Module "${config.id}" is already registered. Overwriting.`,
    );
  }
  modules[config.id] = config;
};

/**
 * Get a module configuration by ID
 */
export const getModuleConfig = (id: string): CodeModuleConfig | undefined => {
  return modules[id];
};

/**
 * Get all registered modules
 */
export const getAllModules = (): CodeModuleConfig[] => {
  return Object.values(modules);
};

/**
 * Get module IDs
 */
export const getModuleIds = (): string[] => {
  return Object.keys(modules);
};
