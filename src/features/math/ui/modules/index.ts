/**
 * MathLab Modules Index
 *
 * Auto-registers all available modules by importing their configs.
 *
 * IMPORTANT: Only import CONFIG files here, not full module index files.
 * Components are loaded lazily in MathLabContent.tsx to prevent
 * heavy dependencies (Three.js, mathjs, etc.) from being pulled into the main bundle.
 */

import { registerModule } from "../../api/registry";
import { analyticsConfig } from "./analytics/config";
import { conceptsConfig } from "./concepts/config";
import { formulasConfig } from "./formulas/config";
import { gymConfig } from "./gym/config";
import { snapConfig } from "./snap/config";
import { symbolicConfig } from "./symbolic/config";
import { threedConfig } from "./threed/config";
import { tutorConfig } from "./tutor/config";
import { vectorsConfig } from "./vectors/config";

// Re-export only configs for direct access
export { analyticsConfig } from "./analytics/config";
export { conceptsConfig } from "./concepts/config";
export { formulasConfig } from "./formulas/config";
export { gymConfig } from "./gym/config";
export { snapConfig } from "./snap/config";
export { symbolicConfig } from "./symbolic/config";
export { threedConfig } from "./threed/config";
export { tutorConfig } from "./tutor/config";
export { vectorsConfig } from "./vectors/config";

// Registration guard to prevent duplicate registrations
let modulesRegistered = false;

// Centralized registration function to avoid circular dependencies
export const registerMathModules = () => {
  if (modulesRegistered) return;
  modulesRegistered = true;

  registerModule(analyticsConfig);
  registerModule(symbolicConfig);
  registerModule(vectorsConfig);
  registerModule(formulasConfig);
  registerModule(threedConfig);
  registerModule(snapConfig);
  registerModule(gymConfig);
  registerModule(tutorConfig);
  registerModule(conceptsConfig);
};
