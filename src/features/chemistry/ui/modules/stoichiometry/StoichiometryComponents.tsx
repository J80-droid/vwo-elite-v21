import { StoichiometrySim } from "@features/simulation";
import React from "react";

export const StoichiometrySidebar: React.FC = () => (
  <StoichiometrySim mode="controls" />
);
export const StoichiometryStage: React.FC = () => (
  <StoichiometrySim mode="stage" />
);
