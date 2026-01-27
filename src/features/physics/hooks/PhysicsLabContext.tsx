/**
 * PhysicsLab Context
 *
 * React Context providing centralized state management for all PhysicsLab modules.
 */

import React from "react";

import { PhysicsModule } from "../types";
import { PhysicsLabContext } from "./PhysicsLabContextInstance";
import { usePhysicsLabState } from "./usePhysicsLabState";

export interface PhysicsLabProviderProps {
  children: React.ReactNode;
  initialModule?: PhysicsModule | undefined;
}

/**
 * Provider component that wraps PhysicsLab and provides state to all modules
 */
export const PhysicsLabProvider: React.FC<PhysicsLabProviderProps> = ({
  children,
  initialModule,
}) => {
  const state = usePhysicsLabState(initialModule);

  return (
    <PhysicsLabContext.Provider value={state}>
      {children}
    </PhysicsLabContext.Provider>
  );
};

export { PhysicsLabContext };
