/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { Glasses } from "lucide-react";

export const opticsConfig: PhysicsModuleConfig = {
  id: "optics",
  label: (_t: any) => "Optica",
  icon: Glasses,
  color: "text-orange-400",
  borderColor: "border-orange-500",
  initialState: {},
};
