import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { Waves } from "lucide-react";

export const interferenceConfig: PhysicsModuleConfig = {
  id: "interference",
  label: (_t: (k: string) => string) => "Interferentie (2D)",
  icon: Waves,
  color: "text-sky-400",
  borderColor: "border-sky-500",
  initialState: {},
};
