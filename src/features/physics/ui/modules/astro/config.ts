import { PhysicsModuleConfig } from "@features/physics/api/registry";
import { Sun } from "lucide-react";

export const astroConfig: PhysicsModuleConfig = {
  id: "astro",
  label: (_t) => "AstroLab",
  icon: Sun,
  color: "text-orange-400",
  borderColor: "border-orange-500/30",
  initialState: {
    temp: 5778,
    luminosityLog: 0,
  },
};
