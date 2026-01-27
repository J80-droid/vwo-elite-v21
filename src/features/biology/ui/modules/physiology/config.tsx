/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Heart } from "lucide-react";

import { BiologyModuleConfig } from "../../../types";
export const physiologyConfig: BiologyModuleConfig = {
  id: "physiology",
  label: (t: any) => t("biology.modules.physiology"),
  icon: Heart,
  description: "Menselijke Anatomie & Fysiologie",
  color: "rose",
  borderColor: "border-rose-500",
};
