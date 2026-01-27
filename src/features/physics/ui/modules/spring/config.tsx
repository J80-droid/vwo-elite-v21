/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { Activity } from "lucide-react";

export const springConfig: PhysicsModuleConfig = {
  id: "spring",
  label: (t: any) => t("physics.modules.spring"),
  icon: Activity,
  color: "text-blue-400",
  borderColor: "border-blue-500",
  initialState: {},
};
