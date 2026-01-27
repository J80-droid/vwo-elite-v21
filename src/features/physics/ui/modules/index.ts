// Physics Module Imports - Centralized Registration
// This avoids circular dependency issues with registry.ts

import { registerModule } from "@features/physics/api/registry";

import { astroConfig } from "./astro/config";
import { circuitsConfig } from "./circuits/config";
import { gymConfig } from "./gym/config";
import { interferenceConfig } from "./interference/config";
import { kinematicsConfig } from "./kinematics/config";
import { magnetismConfig } from "./magnetism/config";
import { mechanicsConfig } from "./mechanics/config";
import { modelingConfig } from "./modeling/config";
import { nuclearConfig } from "./nuclear/config";
import { opticsConfig } from "./optics/config";
import { quantumConfig } from "./quantum/config";
import { relativityConfig } from "./relativity/config";
import { snapConfig } from "./snap/config";
import { springConfig } from "./spring/config";
import { thermodynamicsConfig } from "./thermodynamics/config";
import { vectorsConfig } from "./vectors/config";
import { wavesConfig } from "./waves/config";

let isRegistered = false;

// Register all modules explicitly
export const registerPhysicsModules = () => {
  if (isRegistered) return;
  isRegistered = true;
  registerModule(springConfig);
  registerModule(opticsConfig);
  registerModule(circuitsConfig);
  registerModule(wavesConfig);
  registerModule(interferenceConfig);
  registerModule(vectorsConfig);
  registerModule(mechanicsConfig);
  registerModule(thermodynamicsConfig);
  registerModule(kinematicsConfig);
  registerModule(nuclearConfig);
  registerModule(quantumConfig);
  registerModule(magnetismConfig);
  registerModule(relativityConfig);
  registerModule(snapConfig);
  registerModule(modelingConfig);
  registerModule(astroConfig);
  registerModule(gymConfig);
};
