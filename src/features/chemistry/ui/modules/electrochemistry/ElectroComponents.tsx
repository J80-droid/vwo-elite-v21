import React from "react";

import { ElectrochemistrySim } from "../../../../simulation";

export const ElectroSidebar: React.FC = () => (
  <ElectrochemistrySim mode="controls" />
);
export const ElectroStage: React.FC = () => <ElectrochemistrySim mode="stage" />;
