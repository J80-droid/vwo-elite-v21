import { PhysicsModuleConfig } from "@features/physics/api/registry";
import { Terminal } from "lucide-react";

export const modelingConfig: PhysicsModuleConfig = {
  id: "modeling",
  label: (_t) => "ModelLab",
  icon: Terminal,
  color: "text-fuchsia-400",
  borderColor: "border-fuchsia-500/30",

  // Standaard Model: Harmonische Trilling (Massa-Veer)
  // Dit is direct bruikbaar voor Domein B1
  initialState: {
    name: "Massa Veersysteem",
    // Flattened to 'code' string for compatibility with Sidebar
    code: [
      "Fres = -C * u", // Veerkracht
      "a = Fres / m", // 2e Wet Newton
      "dv = a * dt", // Snelheidsverandering
      "v = v + dv", // Update snelheid
      "du = v * dt", // Plaatsverandering
      "u = u + du", // Update uitwijking
      "t = t + dt", // Tijdstap
    ].join("\n"),
    constants: [
      { symbol: "m", value: 0.5, unit: "kg" },
      { symbol: "C", value: 20, unit: "N/m" },
    ],
    initialValues: [
      { symbol: "u", value: 0.1, unit: "m", isState: true },
      { symbol: "v", value: 0, unit: "m/s", isState: true },
      { symbol: "t", value: 0, unit: "s", isState: true },
    ],
    dt: 0.01,
    duration: 5.0,
    runVersion: 0,
  },
};
