/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { BrainCircuit } from "lucide-react";

export const quantumConfig: PhysicsModuleConfig = {
  id: "quantum",
  label: (_t: any) => "Quantum",
  icon: BrainCircuit,
  color: "text-violet-500",
  borderColor: "border-violet-600",
  initialState: {},
};
