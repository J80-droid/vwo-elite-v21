import { ChemistryModuleConfig } from "../types";

// Registry Map
const modules: Record<string, ChemistryModuleConfig> = {};

export const registerModule = (config: ChemistryModuleConfig) => {
  modules[config.id] = config;
};

export const getModuleConfig = (
  id: string,
): ChemistryModuleConfig | undefined => {
  return modules[id];
};

// --- MODULE IMPORTS ---
import { binasConfig } from "../ui/modules/binas/config";
import { electrochemistryConfig } from "../ui/modules/electrochemistry/config";
import { energyConfig } from "../ui/modules/energy/config";
import { orbitalConfig } from "../ui/modules/orbitals/config";
import { periodicConfig } from "../ui/modules/periodic/config";
import { phConfig } from "../ui/modules/ph-engine/config";
import { reactionConfig } from "../ui/modules/reaction/config";
import { redoxConfig } from "../ui/modules/redox/config";
import { snapConfig } from "../ui/modules/snap/config";
import { spectrumConfig } from "../ui/modules/spectrum/config";
import { stereoConfig } from "../ui/modules/stereo/config";
import { stoichiometryConfig } from "../ui/modules/stoichiometry/config";
import { titrationConfig } from "../ui/modules/titration/config";
import { visualizerConfig } from "../ui/modules/visualizer/config";

export const getAllModules = () => [
  periodicConfig,
  visualizerConfig,
  stoichiometryConfig,
  titrationConfig,
  reactionConfig,
  binasConfig,
  snapConfig,
  electrochemistryConfig,
  spectrumConfig,
  redoxConfig,
  phConfig,
  energyConfig,
  stereoConfig,
  orbitalConfig,
];

export const getModuleIds = (): string[] => {
  return Object.keys(modules);
};
