/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Droplets } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const titrationConfig: ChemistryModuleConfig = {
  id: "titration",
  label: (t: any) => t("chemistry.modules.titration"),
  description: (t: any) => t("chemistry.modules.titration_desc"),
  icon: Droplets,
  initialState: {},
};
