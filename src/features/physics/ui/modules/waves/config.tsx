/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { Activity } from "lucide-react";

export const wavesConfig: PhysicsModuleConfig = {
  id: "waves",
  label: (_t: any) => "Trillingen (1D)",
  icon: Activity,
  color: "text-emerald-400",
  borderColor: "border-emerald-500",
  initialState: {},
};
