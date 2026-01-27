import React from "react";

import { SnapSolver } from "../../../../../components/shared/snap-solver";

export const SnapWrapper: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#050505]">
      <SnapSolver customTitle="Reaction Scanner" customColor="cyan" />
    </div>
  );
};
