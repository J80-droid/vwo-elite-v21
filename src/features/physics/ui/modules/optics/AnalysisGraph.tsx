import React from "react";

import { useOpticsEngine } from "./useOpticsEngine";

// Een lichte, transparante grafiek overlay
export const AnalysisGraph: React.FC = () => {
  const { state, derived } = useOpticsEngine();

  // We tonen alleen grafieken voor de enkele lens (basis begrip)
  // Bij systemen wordt de grafiek te complex voor een overlay.
  if (state.scenario !== "single") return null;

  const f = derived.f1 || 100;
  const u = state.objectDistance || 100; // v (voorwerpsafstand)
  const v = derived.v1 || 1000; // b (beeldafstand)

  // Grafiek instellingen
  const size = 300;
  const padding = 40;
  const maxDiopter = 0.025; // Bereik van assen (1/mm) -> 0.025 is 1/40mm (4cm)

  // Coördinaten omrekenen naar pixels
  // x-as = 1/u (1/v in Nl notatie)
  // y-as = 1/v (1/b in Nl notatie)

  const scale = (val: number) => {
    // Map 0..maxDiopter naar 0..(size-padding)
    return (val / maxDiopter) * (size - 2 * padding);
  };

  const invU = 1 / u;
  const invV = Number.isFinite(v) ? 1 / v : 0;
  const invF = 1 / f;

  // Punten voor de lens-lijn (1/u + 1/v = 1/f constant)
  // Als 1/u = 0, 1/v = 1/f
  // Als 1/v = 0, 1/u = 1/f

  const p1 = { x: 0, y: scale(invF) }; // Snijpunt y-as
  const p2 = { x: scale(invF), y: 0 }; // Snijpunt x-as

  // Huidige punt
  const currentP = {
    x: scale(invU),
    y: scale(invV),
  };

  // Oorsprong zit linksonder
  const toSVG = (x: number, y: number) => ({
    x: padding + x,
    y: size - padding - y,
  });

  const svgP1 = toSVG(p1.x, p1.y);
  const svgP2 = toSVG(p2.x, p2.y);
  const svgCur = toSVG(currentP.x, currentP.y);
  const origin = toSVG(0, 0);

  return (
    <div className="absolute top-20 right-4 p-4 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-right-8 w-[340px]">
      <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        (1/v, 1/b) Diagram
      </h3>

      <div className="relative flex justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Assen */}
          <line
            x1={padding}
            y1={size - padding}
            x2={size}
            y2={size - padding}
            stroke="#cbd5e1"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
          <line
            x1={padding}
            y1={size - padding}
            x2={padding}
            y2={0}
            stroke="#cbd5e1"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />

          {/* Labels */}
          <text
            x={size - 10}
            y={size - 15}
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
          >
            1/v
          </text>
          <text x={15} y={20} fill="#94a3b8" fontSize="10" fontWeight="bold">
            1/b
          </text>

          {/* De Lens Lijn (constante f) */}
          <line
            x1={svgP1.x}
            y1={svgP1.y}
            x2={svgP2.x}
            y2={svgP2.y}
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Huidige Status Punt */}
          <circle
            cx={svgCur.x}
            cy={svgCur.y}
            r="6"
            fill="#22d3ee"
            stroke="white"
            strokeWidth="2"
          />

          {/* Projectie lijnen */}
          <line
            x1={svgCur.x}
            y1={svgCur.y}
            x2={svgCur.x}
            y2={origin.y}
            stroke="#22d3ee"
            strokeWidth="1"
            strokeOpacity="0.5"
            strokeDasharray="2 2"
          />
          <line
            x1={svgCur.x}
            y1={svgCur.y}
            x2={origin.x}
            y2={svgCur.y}
            stroke="#22d3ee"
            strokeWidth="1"
            strokeOpacity="0.5"
            strokeDasharray="2 2"
          />

          {/* Defs voor pijltjes */}
          <defs>
            <marker
              id="arrow"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#cbd5e1" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono bg-black/40 p-2 rounded-lg">
        <div>f = {f} mm</div>
        <div>S = {(1000 / f).toFixed(1)} dpt</div>
        <div className="text-cyan-400">1/v = {invU.toFixed(4)}</div>
        <div className="text-cyan-400">1/b = {invV.toFixed(4)}</div>
      </div>

      <p className="mt-2 text-[9px] text-slate-500 italic text-center">
        De gele lijn representeert de lenssterkte. Het blauwe punt beweegt over
        de lijn.
      </p>
    </div>
  );
};
