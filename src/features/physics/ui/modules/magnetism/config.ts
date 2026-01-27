import type { PhysicsModuleConfig } from "@features/physics/api/registry";
import { Magnet } from "lucide-react";

export const magnetismConfig: PhysicsModuleConfig = {
  id: "magnetism",
  label: (t: (k: string, d?: string) => string) =>
    t("physics.modules.magnetism", "Magnetisme"),
  icon: Magnet,
  color: "text-cyan-400",
  borderColor: "border-cyan-500/50",
};
