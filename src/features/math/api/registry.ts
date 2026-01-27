/**
 * MathLab Module Registry
 *
 * Central registry for all MathLab modules enabling plugin-style architecture.
 * New modules can be added by simply registering a config object.
 */

import type { MathModule, MathModuleConfig } from "../types";

// Configuration for a single MathLab module

// Internal registry storage
const registry: Map<MathModule, MathModuleConfig> = new Map();

/**
 * Register a module configuration
 */
export const registerModule = (config: MathModuleConfig): void => {
  if (registry.has(config.id)) {
    console.warn(
      `[MathLab Registry] Module "${config.id}" is already registered. Overwriting.`,
    );
  }
  registry.set(config.id, config);
};

/**
 * Get a module configuration by ID
 */
export const getModuleConfig = (
  id: MathModule,
): MathModuleConfig | undefined => {
  return registry.get(id);
};

// --- MODULE IMPORTS ---
import { analyticsConfig } from "../ui/modules/analytics/config";
import { conceptsConfig } from "../ui/modules/concepts/config";
// import { formulasConfig  } from "../ui/modules/formulas/config";
import { gymConfig } from "../ui/modules/gym/config";
import { snapConfig } from "../ui/modules/snap/config";
import { symbolicConfig } from "../ui/modules/symbolic/config";
import { threedConfig } from "../ui/modules/threed/config";
import { tutorConfig } from "../ui/modules/tutor/config";
import { vectorsConfig } from "../ui/modules/vectors/config";

/**
 * Get all registered modules (in registration order)
 */
export const getAllModules = (): MathModuleConfig[] => [
  // Layer 1: The Gym
  gymConfig,
  // Layer 2: The Concepts
  conceptsConfig,
  // Layer 3: The Tutor
  tutorConfig,
  vectorsConfig,
  threedConfig,
  analyticsConfig,
  symbolicConfig,
  snapConfig,
];

/**
 * Check if a module is registered
 */
export const isModuleRegistered = (id: MathModule): boolean => {
  return registry.has(id);
};

/**
 * Get module IDs in registration order
 */
export const getModuleIds = (): MathModule[] => {
  return Array.from(registry.keys());
};
