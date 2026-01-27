/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { type PhysicsModuleConfig } from "@features/physics/api/registry";
import { Zap } from "lucide-react";

export const relativityConfig: PhysicsModuleConfig = {
  id: "relativity",
  label: (_t: any) => "Relativiteit",
  icon: Zap,
  color: "text-rose-400",
  borderColor: "border-rose-500",
  initialState: {},
};

// Physics constants (natural units: c = 1)
export const PHYSICS_CONSTANTS = {
  c: 1, // Speed of light in natural units
  c_ms: 299792458, // Speed of light in m/s
};

// Color palette for the module
export const RELATIVITY_COLORS = {
  // Frame colors
  frameS: "#94a3b8", // Slate-400 (stationary frame)
  frameSPrime: "#f43f5e", // Rose-500 (moving frame)

  // Light cone
  lightCone: "#fbbf24", // Amber-400

  // Interval types
  timelike: "#10b981", // Emerald-500
  spacelike: "#3b82f6", // Blue-500
  lightlike: "#fbbf24", // Amber-400

  // UI accents
  primary: "#f43f5e", // Rose-500
  secondary: "#3b82f6", // Blue-500
  accent: "#fbbf24", // Amber-400
};

// Default events for initial display
export const DEFAULT_EVENTS = [
  { x: 2, t: 3, label: "A", color: "#f472b6" },
  { x: -2, t: 4, label: "B", color: "#34d399" },
  { x: 0, t: 0, label: "O", color: "#fbbf24" },
];
