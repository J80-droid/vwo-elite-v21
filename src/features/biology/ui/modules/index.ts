// Biology Lab Module Imports - Centralized Registration
import { registerModule } from "../../api/registry";
import { ecologyConfig } from "./ecology/config";
import { genomicsConfig } from "./genomics/config";
import { microscopyConfig } from "./microscopy/config";
import { physiologyConfig } from "./physiology/config";
import { proteinConfig } from "./protein/config";

registerModule(genomicsConfig);
registerModule(microscopyConfig);
registerModule(ecologyConfig);
registerModule(physiologyConfig);
registerModule(proteinConfig);
