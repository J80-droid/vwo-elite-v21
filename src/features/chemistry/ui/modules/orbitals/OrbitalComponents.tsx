import React from "react";

import { OrbitalSim } from "../../../../simulation";

export const OrbitalSidebar: React.FC = () => <OrbitalSim mode="controls" />;
export const OrbitalStage: React.FC = () => <OrbitalSim mode="stage" />;
