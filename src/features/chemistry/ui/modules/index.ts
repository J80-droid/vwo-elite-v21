// Chemistry Lab Module Imports - Centralized Registration
import { registerModule } from "../../api/registry";
import { binasConfig } from "./binas/config";
import { electrochemistryConfig } from "./electrochemistry/config";
import { energyConfig } from "./energy/config";
import { orbitalConfig } from "./orbitals/config";
import { periodicConfig } from "./periodic/config";
import { phConfig } from "./ph-engine/config";
import { reactionConfig } from "./reaction/config";
import { redoxConfig } from "./redox/config";
import { snapConfig } from "./snap/config";
import { spectrumConfig } from "./spectrum/config";
import { stereoConfig } from "./stereo/config";
import { stoichiometryConfig } from "./stoichiometry/config";
import { titrationConfig } from "./titration/config";
// Modules (Auto-registered)
import { visualizerConfig } from "./visualizer/config";

export const registerChemistryModules = () => {
  registerModule(visualizerConfig);
  registerModule(reactionConfig);
  registerModule(titrationConfig);
  registerModule(orbitalConfig);
  registerModule(periodicConfig);
  registerModule(stoichiometryConfig);
  registerModule(electrochemistryConfig);
  registerModule(spectrumConfig);
  registerModule(binasConfig);
  registerModule(redoxConfig);
  registerModule(phConfig);
  registerModule(energyConfig);
  registerModule(stereoConfig);
  registerModule(snapConfig);
};
