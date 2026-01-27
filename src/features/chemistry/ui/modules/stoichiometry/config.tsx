/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Calculator } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const stoichiometryConfig: ChemistryModuleConfig = {
  id: "stoichiometry",
  label: (t: any) => t("chemistry.modules.stoichiometry"),
  description: (t: any) => t("chemistry.modules.stoichiometry_desc"),
  icon: Calculator,
  initialState: {},
};
