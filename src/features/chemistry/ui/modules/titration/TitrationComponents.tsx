import React from "react";

import { TitrationSim } from "../../../../simulation";

export const TitrationSidebar: React.FC = () => (
  <TitrationSim titrationType="strong_acid_strong_base" mode="controls" />
);
export const TitrationStage: React.FC = () => (
  <TitrationSim titrationType="strong_acid_strong_base" mode="stage" />
);
