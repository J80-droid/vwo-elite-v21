// src/features/physics/ui/modules/astro/AstroOverlay.tsx
import React from "react";

import { useAstroEngine } from "./useAstroEngine";

export const AstroOverlay: React.FC = () => {
  const { viewMode, showAnalysis, showVectors } = useAstroEngine();

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-30">
      {/* TOP BAR */}
      <div className="flex justify-between items-start">
        {/* LEFT: Branding & Legend (Always Visible) */}
        <div className="space-y-1">
          <h1 className="text-sm font-bold tracking-widest text-slate-400 uppercase drop-shadow-md">
            Elite Astro Engine <span className="text-cyan-400">v3.2</span>
          </h1>

          {/* Contextual Legend */}
          <div className="text-[10px] text-slate-500 font-mono flex flex-col gap-0.5 opacity-80">
            {viewMode === "3D" ? (
              <span className="text-blue-400">
                Visualization: Spacetime Curvature
              </span>
            ) : (
              <>
                {showVectors && (
                  <span>
                    <span className="text-emerald-400">Green: Velocity</span> |{" "}
                    <span className="text-red-400">Gravity</span>
                  </span>
                )}
                <span className="text-slate-600">
                  Scroll to Zoom • Drag to Pan
                </span>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Mode Indicator (Moves if Analysis opens) */}
        {/* We hide this if Analysis is open to avoid overlap */}
        <div
          className={`transition-opacity duration-300 ${showAnalysis ? "opacity-0" : "opacity-100"}`}
        >
          <div className="text-right">
            <h2
              className={`text-xl font-bold uppercase tracking-widest text-transparent bg-clip-text 
                    ${viewMode === "3D" ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "bg-gradient-to-r from-orange-400 to-red-500"}`}
            >
              {viewMode === "3D" ? "Gravity Well" : "Orbital Plane"}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              {viewMode === "3D"
                ? "Z-Axis = Gravitational Potential"
                : "2D Cartesian Projection"}
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM: Notifications / Status (Optional) */}
      <div className="w-full flex justify-center pb-20 opacity-50">
        {/* Reserved for notifications */}
      </div>
    </div>
  );
};
