import { MathModuleConfig } from "@features/math/types";
import { Dumbbell } from "lucide-react";

export const gymConfig: MathModuleConfig = {
  id: "gym",
  label: (_t) => "The Gym",
  icon: Dumbbell,
  description: "Train parate kennis en algebraïsche vaardigheden",
  color: "amber", // Custom color theme if supported by layout
};
