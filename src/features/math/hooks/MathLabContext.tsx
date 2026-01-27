/**
 * MathLab Context
 *
 * React Context providing centralized state management for all MathLab modules.
 * Modules access state via useMathLabContext() hook instead of prop drilling.
 */

import React, { useMemo, useRef } from "react";

import type {
  GraphPlotterHandle,
  SurfacePlotterHandle,
} from "../../../components/visualization/types";
import { MathModule } from "../types";
import { MathLabContext } from "./MathLabContextInstance";
import { useMathLabState } from "./useMathLabStateV4";

export interface MathLabProviderProps {
  children: React.ReactNode;
  initialModule?: MathModule;
}

/**
 * Provider component that wraps MathLab and provides state to all modules
 */
export const MathLabProvider: React.FC<MathLabProviderProps> = ({
  children,
  initialModule,
}) => {
  const state = useMathLabState(initialModule);

  // Plutonic refs for the plotters, shared across all modules via context
  const surfacePlotterRef = useRef<SurfacePlotterHandle>(null);
  const graphPlotterRef = useRef<GraphPlotterHandle>(null);

  const value = useMemo(
    () => ({
      ...state,
      surfacePlotterRef,
      graphPlotterRef,
    }),
    [state],
  );

  return (
    <MathLabContext.Provider value={value}>{children}</MathLabContext.Provider>
  );
};

// Re-export Context for internal hooks
export { MathLabContext };
