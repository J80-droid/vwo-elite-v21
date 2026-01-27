/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Zap } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const redoxConfig: ChemistryModuleConfig = {
  id: "redox",
  label: (t: any) => t("chemistry.modules.redox-reactor"),
  description: (t: any) => t("chemistry.modules.redox-reactor_desc"),
  icon: Zap,
};
