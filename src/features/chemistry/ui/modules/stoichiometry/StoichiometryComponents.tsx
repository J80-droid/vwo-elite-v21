import { StoichiometrySim } from "@features/simulation";
import React from "react";

export const StoichiometrySidebar: React.FC = () => (
  <StoichiometrySim mode="sidebar" />
);
export const StoichiometryStage: React.FC = () => (
  <StoichiometrySim mode="main" />
);
