import type { LucideIcon } from "lucide-react";
import React from "react";

import type { PhysicsModule, TFunction } from "../types";

// Configuration for a single PhysicsLab module
export interface PhysicsModuleConfig {
  /** Unique module identifier */
  id: PhysicsModule;
  /** Localized label function */
  label: (t: TFunction) => string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind text color class */
  color: string;
  /** Tailwind border color class */
  borderColor: string;

  /** Initial state for the module (will be merged into global moduleStates) */
  initialState?: unknown;

  /** Component for the main stage/visualization area (Lazy loaded via Layout) */
  Stage?: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  /** Component for the left sidebar controls (optional, Lazy loaded via Layout) */
  Sidebar?: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  /** Component for parameters display (optional, Lazy loaded via Layout) */
  Parameters?: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  /** Component for analysis output (optional, Lazy loaded via Layout) */
  Analysis?: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
}

// Internal registry storage
const registry: Map<PhysicsModule, PhysicsModuleConfig> = new Map();

/**
 * Register a module configuration
 */
export function registerModule(config: PhysicsModuleConfig): void {
  if (registry.has(config.id)) {
    console.warn(
      `[PhysicsLab Registry] Module "${config.id}" is already registered. Overwriting.`,
    );
  }
  registry.set(config.id, config);
}

export function getModuleConfig(
  id: PhysicsModule,
): PhysicsModuleConfig | undefined {
  return registry.get(id);
}

export function getAllModules(): PhysicsModuleConfig[] {
  return Array.from(registry.values());
}

export function getModuleIds(): PhysicsModule[] {
  return Array.from(registry.keys());
}
