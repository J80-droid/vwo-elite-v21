/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Camera } from "lucide-react";

import { ChemistryModuleConfig } from "../../../types";
export const snapConfig: ChemistryModuleConfig = {
  id: "snap",
  label: () => "Scanner",
  description: (_t: any) => "Reaction Analysis",
  icon: Camera,
  color: "text-cyan-400",
};
