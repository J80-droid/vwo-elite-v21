/* eslint-disable no-useless-escape */
/* eslint-disable unused-imports/no-unused-vars */
/**
 * Symbolic Stage Component
 *
 * Visualization for symbolic calculus module.
 */

import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type {
  ModuleStageProps,
  SymbolicModuleState,
} from "@features/math/types";
import React from "react";

import { GraphPlotter } from "@/components/visualization/GraphPlotter";

export const SymbolicStage: React.FC<ModuleStageProps> = ({
  consoleExpanded,
  consoleHeight,
  graphPlotterRef,
}) => {
  const { scannerX, solutionResult } = useMathLabContext();
  const [state] = useModuleState<SymbolicModuleState>("symbolic");

  // Extract roots for visualization if result is of type 'roots'
  const highlightedPoints = React.useMemo(() => {
    if (solutionResult?.type === "roots" && solutionResult.finalAnswer) {
      try {
        // finalAnswer is typically a string like "[2, -2]" or just "2"
        const cleaned = solutionResult.finalAnswer.replace(/[\[\]]/g, "");
        return cleaned
          .split(",")
          .map((val: string) => ({
            x: parseFloat(val.trim()),
            y: 0,
            label: `x = ${val.trim()}`,
          }))
          .filter((p: { x: number }) => !isNaN(p.x));
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [solutionResult]);

  return (
    <GraphPlotter
      ref={graphPlotterRef}
      functions={[state.expression]}
      consoleExpanded={consoleExpanded}
      consoleHeight={consoleHeight}
      scannerX={scannerX}
      highlightedPoints={highlightedPoints}
    />
  );
};
