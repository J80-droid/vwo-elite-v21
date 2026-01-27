/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Activity } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const spectrumConfig: ChemistryModuleConfig = {
  id: "spectrum",
  label: (t: any) => t("chemistry.modules.spectrum"),
  description: (t: any) => t("chemistry.modules.spectrum_desc"),
  icon: Activity,
  initialState: {},
};
