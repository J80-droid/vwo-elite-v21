/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Orbit } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const orbitalConfig: ChemistryModuleConfig = {
  id: "orbitals",
  label: (t: any) => t("chemistry.modules.orbitals"),
  description: (t: any) => t("chemistry.modules.orbitals_desc"),
  icon: Orbit,
  initialState: {},
};
