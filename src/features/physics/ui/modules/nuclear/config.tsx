/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { Radiation } from "lucide-react";

export const nuclearConfig: PhysicsModuleConfig = {
  id: "nuclear",
  label: (_t: any) => "Kernfysica",
  icon: Radiation,
  color: "text-amber-400",
  borderColor: "border-amber-500",
  initialState: {},
};
