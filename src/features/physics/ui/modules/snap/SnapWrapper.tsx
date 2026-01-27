import React from "react";

import { SnapSolver } from "@/components/shared/snap-solver";

export const SnapWrapper: React.FC = () => {
  return (
    <div className="w-full h-full bg-black">
      <SnapSolver customTitle="Physics Solver" customColor="emerald" />
    </div>
  );
};
