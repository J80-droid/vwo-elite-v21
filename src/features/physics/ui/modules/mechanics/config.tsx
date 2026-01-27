import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { Box } from "lucide-react";

export const mechanicsConfig: PhysicsModuleConfig = {
  id: "mechanics",
  label: (t) => t("physics.modules.mechanics", "Mechanics"),
  icon: Box,
  color: "text-sky-500", // Changed to Sky
  borderColor: "border-sky-500",
  initialState: {},
};
