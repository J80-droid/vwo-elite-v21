import React, { ReactNode } from "react";

import { BiologyLabContext } from "./BiologyLabContextInstance";
import { useBiologyLabState } from "./useBiologyLabState";

export const BiologyLabProvider: React.FC<{
  children: ReactNode;
  initialModule?: string;
}> = ({ children, initialModule }) => {
  const state = useBiologyLabState(initialModule);

  return (
    <BiologyLabContext.Provider value={state}>
      {children}
    </BiologyLabContext.Provider>
  );
};

export { BiologyLabContext };
