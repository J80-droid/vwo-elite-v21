/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { TableProperties } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const periodicConfig: ChemistryModuleConfig = {
  id: "periodic",
  label: (t: any) => t("chemistry.modules.periodic"),
  description: (t: any) => t("chemistry.modules.periodic_desc"),
  icon: TableProperties,
  initialState: {},
};
