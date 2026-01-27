import { MathModuleConfig } from "@features/math/types";
import { Camera } from "lucide-react";

export const snapConfig: MathModuleConfig = {
  id: "snap",
  label: () => "Snap & Solve",

  icon: Camera,
  color: "text-blue-400",
};
