import React from "react";

import { ElectrochemistrySim } from "../../../../simulation";

export const ElectroSidebar: React.FC = () => (
  <ElectrochemistrySim mode="sidebar" />
);
export const ElectroStage: React.FC = () => <ElectrochemistrySim mode="main" />;
