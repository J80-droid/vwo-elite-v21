import React from "react";

import { StereoTrainer } from "./StereoTrainer";

export const StereoSidebar: React.FC = () => <StereoTrainer mode="controls" />;
export const StereoStage: React.FC = () => <StereoTrainer mode="stage" />;
