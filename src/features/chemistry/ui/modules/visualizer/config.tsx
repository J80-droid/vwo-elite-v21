/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Atom } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const visualizerConfig: ChemistryModuleConfig = {
  id: "visualizer",
  label: (t: any) => t("chemistry.modules.visualizer"),
  description: (t: any) => t("chemistry.modules.visualizer_desc"),
  icon: Atom,
  initialState: {
    query: "",
    molecule: null,
    analysis: null,
  },
};
