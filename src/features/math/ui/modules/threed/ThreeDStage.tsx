import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type { ModuleStageProps, ThreeDModuleState } from "@features/math/types";
import React from "react";

import { SurfacePlotter } from "@/components/visualization/SurfacePlotter";

export const ThreeDStage: React.FC<ModuleStageProps> = ({
  consoleExpanded,
  consoleHeight,
  surfacePlotterRef,
}) => {
  const { symbolicFn, isAnimatingLiquid } = useMathLabContext();

  const [state] = useModuleState<ThreeDModuleState>("3d");

  const expression = symbolicFn || "sin(sqrt(x^2 + y^2))";

  return (
    <div
      style={{
        height: `calc(100% - ${consoleExpanded ? consoleHeight : 56}px)`,
        transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      className="w-full relative p-4"
    >
      <SurfacePlotter
        ref={surfacePlotterRef}
        expression={expression}
        range={state.surfaceRange}
        resolution={state.surfaceResolution}
        showLaser={state.showLaser}
        showGradients={state.showGradients}
        showContours={state.showContours}
        showGlass={state.showGlass}
        showTangent={state.showTangent}
        showCritical={state.showCritical}
        wireframe={state.wireframe}
        showHologram={state.showHologram}
        isAnimating={isAnimatingLiquid}
        animationSpeed={state.animationSpeed ?? 1} // Fallback if undefined
        colorMode={state.colorMode}
        surfaceColor1={state.surfaceColor1}
        surfaceColor2={state.surfaceColor2}
        liquidStrength={state.liquidStrength}
        liquidSpeed={state.liquidSpeed}
        surfaceOpacity={state.surfaceOpacity}
        surfaceRoughness={state.surfaceRoughness}
        clipX={state.clipX}
        clipY={state.clipY}
        clipZ={state.clipZ}
        autoOrbit={state.autoOrbit}
      />
    </div>
  );
};
