/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Battery } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const electrochemistryConfig: ChemistryModuleConfig = {
  id: "electrochemistry",
  label: (t: any) => t("chemistry.modules.electrochemistry"),
  description: (t: any) => t("chemistry.modules.electrochemistry_desc"),
  icon: Battery,
  initialState: {},
};
