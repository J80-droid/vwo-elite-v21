import React, { ReactNode } from "react";

import {
  ThreeDLabContext,
  ThreeDLabContextType,
} from "./ThreeDLabContextInternal";
import { useThreeDLabState } from "./useThreeDLabState";

export const ThreeDLabProvider: React.FC<{
  children: ReactNode;
  initialModule?: string | undefined;
}> = ({ children, initialModule }) => {
  const state = useThreeDLabState(initialModule);

  return (
    <ThreeDLabContext.Provider value={state as unknown as ThreeDLabContextType}>
      {children}
    </ThreeDLabContext.Provider>
  );
};
