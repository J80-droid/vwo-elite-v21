import { TrendingUp } from "lucide-react";
import React, { useMemo } from "react";

import { calculateGamma, useRelativityEngine } from "./useRelativityEngine";

export const TimeDilationGraph: React.FC = () => {
  const { beta } = useRelativityEngine();

  // Generate curve points
  const curvePoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    for (let b = 0; b <= 0.99; b += 0.01) {
      const g = calculateGamma(b);
      points.push({ x: b, y: Math.min(g, 10) }); // Cap at 10 for display
    }
    return points;
  }, []);

  // Current marker position
  const currentGamma = calculateGamma(Math.abs(beta));
  const markerX = Math.abs(beta) * 100;
  const markerY = 100 - Math.min(currentGamma / 10, 1) * 100;

  // SVG path for curve
  const pathD = useMemo(() => {
    return curvePoints
      .map((p, i) => {
        const x = p.x * 100;
        const y = 100 - (p.y / 10) * 100;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [curvePoints]);

  return (
    <div className="p-4 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            γ(β) Grafiek
          </span>
        </div>
        <span className="text-[9px] text-slate-500 font-mono">
          Tijddilatatie
        </span>
      </div>

      {/* Graph */}
      <div className="relative w-full h-32 bg-slate-900/50 rounded-lg overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          {/* Grid Lines */}
          <g stroke="#334155" strokeWidth="0.5">
            {/* Horizontal */}
            {[0.2, 0.4, 0.6, 0.8].map((y) => (
              <line key={y} x1="0" y1={y * 100} x2="100" y2={y * 100} />
            ))}
            {/* Vertical */}
            {[0.2, 0.4, 0.6, 0.8].map((x) => (
              <line key={x} x1={x * 100} y1="0" x2={x * 100} y2="100" />
            ))}
          </g>

          {/* Asymptote at β = 1 */}
          <line
            x1="99"
            y1="0"
            x2="99"
            y2="100"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Curve */}
          <path d={pathD} fill="none" stroke="url(#gradient)" strokeWidth="2" />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Current Position Marker */}
          <circle
            cx={markerX}
            cy={markerY}
            r="4"
            fill="#ffffff"
            stroke="#f43f5e"
            strokeWidth="2"
          />

          {/* Vertical line to marker */}
          <line
            x1={markerX}
            y1={markerY}
            x2={markerX}
            y2="100"
            stroke="#f43f5e"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.5"
          />
        </svg>

        {/* Axis Labels */}
        <div className="absolute bottom-1 left-1 text-[8px] text-slate-500">
          0
        </div>
        <div className="absolute bottom-1 right-1 text-[8px] text-slate-500">
          β → 1
        </div>
        <div className="absolute top-1 left-1 text-[8px] text-slate-500">
          γ = 10
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-500">
          β = {Math.abs(beta).toFixed(2)}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex justify-between text-[9px]">
        <span className="text-emerald-400">Laag effect</span>
        <span className="text-amber-400">Significant</span>
        <span className="text-red-400">Extreem</span>
      </div>
    </div>
  );
};
