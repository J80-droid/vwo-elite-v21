/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Atom } from "lucide-react";

import { BiologyModuleConfig } from "../../../types";
export const proteinConfig: BiologyModuleConfig = {
    id: "protein",
    label: (t: any) => t("biology.modules.protein") || "Protein Explorer",
    icon: Atom,
    description: "AlphaFold 3D Structuur Predicties & Eiwit Analyse",
    color: "purple",
    borderColor: "border-purple-500",
};
