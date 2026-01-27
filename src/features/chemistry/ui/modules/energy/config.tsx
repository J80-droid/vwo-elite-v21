/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Zap } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const energyConfig: ChemistryModuleConfig = {
  id: "energy",
  label: (t: any) => t("chemistry.modules.energy"),
  description: (t: any) => t("chemistry.modules.energy_desc"),
  icon: Zap,
};
