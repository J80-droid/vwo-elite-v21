/**
 * 3D Studio Modules Index
 * Centralized registry for all 3D exploration modules.
 */

import { registerModule } from "../../api/registry";
import { spatialConfig } from "./spatial/config";
import { stereoConfig } from "./stereo/config";
import { slicerConfig } from "./slicer/config";
import { buildConfig } from "./build/config";
import { projectionConfig } from "./projection/config";
import { constructionConfig } from "./construction/config";
import { crossSectionConfig } from "./cross_section/config";

// Re-export configs
export { spatialConfig } from "./spatial/config";
export { stereoConfig } from "./stereo/config";
export { slicerConfig } from "./slicer/config";
export { buildConfig } from "./build/config";
export { projectionConfig } from "./projection/config";
export { constructionConfig } from "./construction/config";
export { crossSectionConfig } from "./cross_section/config";

let modulesRegistered = false;

/**
 * Registers all 3D Studio modules to the hub.
 * Called during Hub initialization.
 */
export const registerThreeDModules = () => {
    if (modulesRegistered) return;
    modulesRegistered = true;

    registerModule(spatialConfig);
    registerModule(stereoConfig);
    registerModule(slicerConfig);
    registerModule(buildConfig);
    registerModule(projectionConfig);
    registerModule(constructionConfig);
    registerModule(crossSectionConfig);
};
