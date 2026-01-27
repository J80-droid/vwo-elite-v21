/**
 * Analytics Stage Component
 *
 * Main visualization area - wraps GraphPlotter.
 */

import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type {
  AnalyticsModuleState,
  ModuleStageProps,
} from "@features/math/types";
import React from "react";

import { GraphPlotter } from "@/components/visualization/GraphPlotter";

export const AnalyticsStage: React.FC<ModuleStageProps> = ({
  consoleExpanded,
  consoleHeight,
  graphPlotterRef,
}) => {
  const { processedFunctions, integralState, scannerX } = useMathLabContext();

  const [state] = useModuleState<AnalyticsModuleState>("analytics");

  return (
    <GraphPlotter
      ref={graphPlotterRef}
      functions={processedFunctions}
      {...(integralState.show
        ? {
            integral: {
              fnIndex: 0,
              from: integralState.from,
              to: integralState.to,
            },
          }
        : {})}
      riemannState={{
        show: state.showRiemann ?? false,
        type: state.riemannType ?? "left",
        n: state.riemannIntervals ?? 10,
      }}
      showTangent={state.showTangent ?? false}
      isTangentAnimating={state.isTangentAnimating ?? false}
      tangentSpeed={state.tangentSpeed ?? 1}
      showUnitCircle={state.showUnitCircle ?? false}
      unitCircleMode={state.unitCircleMode ?? "standard"}
      showAsymptotes={state.showAsymptotes ?? false}
      showSecantLine={state.showSecantLine ?? false}
      showDerivativeGraph={state.showDerivativeGraph ?? false}
      consoleExpanded={consoleExpanded}
      consoleHeight={consoleHeight}
      plotMode={state.plotMode}
      scannerX={scannerX}
    />
  );
};
