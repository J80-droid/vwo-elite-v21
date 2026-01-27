/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Waves } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const phConfig: ChemistryModuleConfig = {
  id: "ph-engine",
  label: (t: any) => t("chemistry.modules.ph-engine"),
  description: (t: any) => t("chemistry.modules.ph-engine_desc"),
  icon: Waves,
};
