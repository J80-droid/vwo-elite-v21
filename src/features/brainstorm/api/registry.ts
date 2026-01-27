import { BrainstormModuleConfig } from "@features/brainstorm/types";

// Internal registry storage
const modules: Record<string, BrainstormModuleConfig> = {};

/**
 * Get all registered modules
 */
export const getAllModules = (): BrainstormModuleConfig[] => {
  return Object.values(modules);
};
