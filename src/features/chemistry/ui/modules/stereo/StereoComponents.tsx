import React from "react";

import { StereoTrainer } from "./StereoTrainer";

export const StereoSidebar: React.FC = () => (
  <div className="p-4 text-xs text-slate-500 italic uppercase tracking-widest">
    Gebruik het hoofdscherm voor de Stereo-Isomerie training.
  </div>
);
export const StereoStage: React.FC = () => <StereoTrainer />;
