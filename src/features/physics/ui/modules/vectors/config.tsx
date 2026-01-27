/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { Maximize2 } from "lucide-react";

export const vectorsConfig: PhysicsModuleConfig = {
  id: "vectors",
  label: (t: any) => t("physics.modules.vectors"),
  icon: Maximize2,
  color: "text-emerald-400",
  borderColor: "border-emerald-500",
  initialState: {
    fieldType: "electric",
    showInduction: false,
    sliceZ: null,
    polarity: 1,
    strengthMultiplier: 1.0,
    charges: [
      { id: "1", position: [-3, 0, 0], q: 1 },
      { id: "2", position: [3, 0, 0], q: -1 },
    ],
  },
};
