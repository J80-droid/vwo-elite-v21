/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Shapes } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const stereoConfig: ChemistryModuleConfig = {
  id: "stereo",
  label: (t: any) => t("chemistry.modules.stereo"),
  description: (t: any) => t("chemistry.modules.stereo_desc"),
  icon: Shapes,
  initialState: {},
};
