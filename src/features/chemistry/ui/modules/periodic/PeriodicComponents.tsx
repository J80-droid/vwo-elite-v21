import { PeriodicTableSim } from "@features/simulation";
import React from "react";

export const PeriodicSidebar: React.FC = () => <PeriodicTableSim mode="controls" />;
export const PeriodicStage: React.FC = () => <PeriodicTableSim mode="stage" />;
