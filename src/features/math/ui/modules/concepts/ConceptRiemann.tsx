import "mafs/core.css";

import { Grid, Play, Sliders } from "lucide-react";
import { Coordinates, Mafs, Plot, useMovablePoint } from "mafs";
import React, { useMemo, useState } from "react";

export const ConceptRiemann: React.FC = () => {
  const [n, setN] = useState(10);

  // Draggable point for left boundary
  const pointA = useMovablePoint([-2, 0], {
    constrain: (p) => [Math.min(p[0], 1.5), 0],
  });

  // Draggable point for right boundary
  const pointB = useMovablePoint([2, 0], {
    constrain: (p) => [Math.max(p[0], pointA.x + 0.5), 0],
  });

  // Derive a and b directly from movable points to avoid state sync loops
  const a = pointA.x;
  const b = pointB.x;

  // The function to integrate
  const f = (x: number) => 0.5 * (x ** 3 - 3 * x + 2);

  // Calculate Riemann Sum (Left)
  const riemannSum = useMemo(() => {
    const dx = (b - a) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += f(a + i * dx) * dx;
    }
    return sum;
  }, [a, b, n]);

  // Generate rectangle data
  const rectangles = useMemo(() => {
    const dx = (b - a) / n;
    return Array.from({ length: n }).map((_, i) => {
      const x = a + i * dx;
      const y = f(x);
      return { x, y, width: dx };
    });
  }, [a, b, n]);

  return (
    <div className="h-full flex flex-col bg-obsidian-950 font-outfit text-white overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Grid size={20} className="text-amber-400" />
            Area Architect
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Riemannsommen & Integralen
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-[9px] uppercase font-black text-slate-500 block mb-1">
              Integraal ≈
            </span>
            <span className="font-mono text-amber-400 text-lg tabular-nums font-bold">
              {riemannSum.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Visualisatie Stage */}
      <div className="flex-1 relative m-4 flex flex-col gap-4 shrink-0 min-h-[500px]">
        <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden shadow-inner group">
          <div className="absolute top-4 left-4 z-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Visualisatie: Aantal Rechthoeken (n = {n})
          </div>

          <Mafs viewBox={{ x: [-4, 4], y: [-2, 5] }} pan={true}>
            <Coordinates.Cartesian />

            {/* The Function */}
            <Plot.OfX y={f} color="#ffffff" weight={2} opacity={0.6} />

            {/* Riemann Rectangles */}
            {rectangles.map((rect, i) => (
              <rect
                key={i}
                x={rect.x}
                y={rect.y > 0 ? 0 : rect.y}
                width={rect.width}
                height={Math.abs(rect.y)}
                fill={
                  rect.y > 0 ? "rgba(251,191,36,0.3)" : "rgba(239,68,68,0.3)"
                }
                stroke={rect.y > 0 ? "rgba(251,191,36,1)" : "rgba(239,68,68,1)"}
                strokeWidth={1}
                className="transition-all duration-300"
              />
            ))}

            {/* Boundary Points */}
            {pointA.element}
            {pointB.element}

            {/* Labels for boundaries */}
            <text
              x={pointA.x}
              y={-0.5}
              fill="#fb923c"
              fontSize={12}
              textAnchor="middle"
              fontWeight="bold"
            >
              a = {pointA.x.toFixed(1)}
            </text>
            <text
              x={pointB.x}
              y={-0.5}
              fill="#fb923c"
              fontSize={12}
              textAnchor="middle"
              fontWeight="bold"
            >
              b = {pointB.x.toFixed(1)}
            </text>
          </Mafs>
        </div>

        {/* Controls */}
        <div className="h-24 bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center gap-12">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
                <Sliders size={12} /> Precisie (n)
              </span>
              <span className="text-white font-mono font-bold">{n}</span>
            </div>
            <input
              type="range"
              min="4"
              max="100"
              value={n}
              onChange={(e) => setN(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-400 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
            <Play size={14} className="text-amber-400" />
            Sleep de <span className="text-white font-bold">
              oranje punten
            </span>{" "}
            om het interval aan te passen.
          </div>
        </div>
      </div>

      {/* Inzicht Footer */}
      <div className="p-4 text-center bg-black/20 border-t border-white/5">
        <p className="text-slate-400 text-sm">
          Inzicht: Hoe groter{" "}
          <span className="text-amber-400 font-bold">n</span>, hoe kleiner de
          afwijking. Oppervlakte onder de x-as telt{" "}
          <span className="text-red-400 font-bold">negatief</span> mee.
        </p>
      </div>
    </div>
  );
};
