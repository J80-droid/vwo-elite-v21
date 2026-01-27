/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { Zap } from "lucide-react";

export const circuitsConfig: PhysicsModuleConfig = {
  id: "circuits",
  label: (t: any) => t("physics.circuits.title"),
  icon: Zap,
  color: "text-amber-400",
  borderColor: "border-amber-500",
  initialState: {},
};
