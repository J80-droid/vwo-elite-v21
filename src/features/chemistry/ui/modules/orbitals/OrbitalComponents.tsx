import React from "react";

import { OrbitalSim } from "../../../../simulation";

export const OrbitalSidebar: React.FC = () => <OrbitalSim mode="sidebar" />;
export const OrbitalStage: React.FC = () => <OrbitalSim mode="main" />;
