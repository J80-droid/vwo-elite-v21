/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { Thermometer } from "lucide-react";

export const thermodynamicsConfig: PhysicsModuleConfig = {
  id: "thermodynamics",
  label: (t: any) => t("physics.thermodynamics.title"),
  icon: Thermometer,
  color: "text-rose-400",
  borderColor: "border-rose-500",
  initialState: {},
};
