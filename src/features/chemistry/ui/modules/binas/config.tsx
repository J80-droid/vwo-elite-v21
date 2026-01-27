/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { BookOpen } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const binasConfig: ChemistryModuleConfig = {
  id: "binas",
  label: (t: any) => t("chemistry.modules.binas"),
  description: (t: any) => t("chemistry.modules.binas_desc"),
  icon: BookOpen,
  initialState: {
    activeTab: "T45",
  },
};
