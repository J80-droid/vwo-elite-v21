import { PhysicsModuleConfig } from "@features/physics/api/registry";
import { Dumbbell } from "lucide-react";

export const gymConfig: PhysicsModuleConfig = {
  id: "gym",
  label: (_t) => "Physics Gym",
  icon: Dumbbell,
  color: "text-amber-400",
  borderColor: "border-amber-500/30",
};
