/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { FlaskConical } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const reactionConfig: ChemistryModuleConfig = {
  id: "reaction",
  label: (t: any) => t("chemistry.modules.reaction"),
  description: (t: any) => t("chemistry.modules.reaction_desc"),
  icon: FlaskConical,
  initialState: {},
};
