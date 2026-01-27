import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { TrendingUp } from "lucide-react";

export const kinematicsConfig: PhysicsModuleConfig = {
  id: "kinematics",
  label: (t: (key: string) => string) => t("physics.kinematics.title"),
  icon: TrendingUp,
  color: "text-emerald-400",
  borderColor: "border-emerald-500",
  initialState: {},
};
