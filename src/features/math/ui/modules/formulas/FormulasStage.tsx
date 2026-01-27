/**
 * Formulas Stage Component
 *
 * Visualization for the formula reference module.
 */

import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type {
  FormulasModuleState,
  ModuleStageProps,
} from "@features/math/types";
import React, { useMemo } from "react";

import { GraphPlotter } from "@/components/visualization/GraphPlotter";

export const FormulasStage: React.FC<ModuleStageProps> = ({
  consoleExpanded,
  consoleHeight,
  graphPlotterRef,
}) => {
  const { binasVisConfig, scannerX } = useMathLabContext();

  const [state] = useModuleState<FormulasModuleState>("formulas");

  // Process the visualization with current inputs
  const visData = useMemo(() => {
    if (!binasVisConfig) return null;

    if (binasVisConfig.type === "plot") {
      let fn = binasVisConfig.fn;
      // Substitute inputs but SKIP plotting variables
      Object.entries(state.formulaInputs).forEach(([key, val]) => {
        if (["x", "t", "theta"].includes(key)) return;

        // Escape key for regex (crucial for keys like |v|)
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escapedKey}\\b`, "g");

        if (val && !isNaN(Number(val))) {
          fn = fn.replace(regex, `(${val})`);
        } else {
          fn = fn.replace(regex, `(0)`);
        }
      });
      return {
        type: "plot" as const,
        functions: [fn] as (string | null | undefined)[],
      };
    }

    if (binasVisConfig.type === "vector") {
      // Extract x and y components from inputs
      const vx = Number(state.formulaInputs["x"]) || 0;
      const vy = Number(state.formulaInputs["y"]) || 0;
      const vz = Number(state.formulaInputs["z"]) || 0;

      return {
        type: "vector" as const,
        vectors: [
          {
            id: "vis_vec",
            symbol: "v",
            x: vx,
            y: vy,
            z: vz,
            color: "#F055BA", // Pink-500
          },
        ],
      };
    }

    return null;
  }, [binasVisConfig, state.formulaInputs]);

  return (
    <GraphPlotter
      ref={graphPlotterRef}
      functions={visData?.type === "plot" ? visData.functions : []}
      vectors={visData?.type === "vector" ? visData.vectors : []}
      consoleExpanded={consoleExpanded}
      consoleHeight={consoleHeight}
      scannerX={scannerX}
    />
  );
};
