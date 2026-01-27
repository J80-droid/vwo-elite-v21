import "mafs/core.css";

import { Circle } from "lucide-react";
import { Coordinates, Mafs, Plot, Point, useMovablePoint, Vector } from "mafs";
import React from "react";

export const ConceptUnitCircle: React.FC = () => {
  // State voor de hoek (in radialen)
  // We gebruiken een movable point op de cirkel om de hoek te bepalen
  const point = useMovablePoint([1, 0], {
    constrain: (p) => {
      // Dwing het punt op de eenheidscirkel
      const angle = Math.atan2(p[1], p[0]);
      return [Math.cos(angle), Math.sin(angle)];
    },
  });

  // Bereken huidige hoek uit het punt (0 tot 2PI)
  const rawAngle = Math.atan2(point.y, point.x);
  const angle = rawAngle < 0 ? rawAngle + 2 * Math.PI : rawAngle;

  return (
    <div className="h-full flex flex-col bg-obsidian-950 font-outfit text-white overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Circle size={20} className="text-cyan-400" />
            Sine Weaver
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Verbind de Cirkel met de Golf
          </p>
        </div>
        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 font-mono text-cyan-400 tabular-nums">
          θ = {angle.toFixed(2)} rad
        </div>
      </div>

      {/* Visualisatie Stage */}
      <div className="flex-1 relative m-4 flex flex-col lg:flex-row gap-4 shrink-0 min-h-[600px] lg:min-h-0">
        {/* DEEL 1: De Eenheidscirkel (Input) */}
        <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden shadow-inner group min-h-[300px]">
          <div className="absolute top-4 left-4 z-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Input: Rotatie
          </div>
          <Mafs
            viewBox={{ x: [-1.5, 1.5], y: [-1.5, 1.5] }}
            pan={false}
            zoom={false}
          >
            <Coordinates.Cartesian
              xAxis={{ lines: false, labels: false }}
              yAxis={{ lines: false, labels: false }}
            />
            {/* De Cirkel */}
            <Plot.OfX
              y={(x) => Math.sqrt(Math.max(0, 1 - x * x))}
              color="#3b82f6"
              opacity={0.3}
            />
            <Plot.OfX
              y={(x) => -Math.sqrt(Math.max(0, 1 - x * x))}
              color="#3b82f6"
              opacity={0.3}
            />
            {/* De Straal Vector */}
            <Vector tail={[0, 0]} tip={[point.x, point.y]} color="#06b6d4" />
            {/* Projectielijnen in cirkel */}
            <Vector
              tail={[point.x, point.y]}
              tip={[point.x, 0]}
              color="#ef4444"
              opacity={0.5}
              style="dashed"
            />{" "}
            {/* Cosinus component */}
            <Vector
              tail={[point.x, point.y]}
              tip={[0, point.y]}
              color="#10b981"
              opacity={0.5}
              style="dashed"
            />{" "}
            {/* Sinus component */}
            {/* Het Sleepbare Punt */}
            {point.element}
          </Mafs>
        </div>

        {/* DEEL 2: De Grafiek (Output) */}
        <div className="flex-[1.5] bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden shadow-inner min-h-[300px]">
          <div className="absolute top-4 left-4 z-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Output: Sinusgolf
          </div>

          <Mafs
            viewBox={{ x: [0, 2 * Math.PI], y: [-1.5, 1.5] }}
            pan={false}
            zoom={false}
          >
            <Coordinates.Cartesian
              xAxis={{
                lines: Math.PI / 2,
                labels: (x) =>
                  x === 0
                    ? "0"
                    : x === Math.PI
                      ? "π"
                      : x === 2 * Math.PI
                        ? "2π"
                        : "",
              }}
              yAxis={{ lines: 0.5 }}
            />

            {/* De Sinusgolf (vast) */}
            <Plot.OfX y={Math.sin} color="#3b82f6" opacity={0.2} />

            {/* De Trace tot aan het huidige punt */}
            <Plot.OfX
              y={Math.sin}
              color="#06b6d4"
              weight={3}
              domain={[0, angle]}
            />

            <Point x={angle} y={Math.sin(angle)} color="#06b6d4" />

            {/* Horizontale Laserlijn vanaf links (de y-waarde) */}
            <Vector
              tail={[-10, Math.sin(angle)]} // Komt 'vanuit de cirkel'
              tip={[angle, Math.sin(angle)]}
              color="#10b981"
              style="dashed"
              opacity={0.6}
            />

            {/* Verticale lijn naar x-as (de hoek) */}
            <Vector
              tail={[angle, 0]}
              tip={[angle, Math.sin(angle)]}
              color="#ef4444"
              style="dashed"
              opacity={0.4}
            />
          </Mafs>
        </div>
      </div>

      {/* Uitleg Footer */}
      <div className="p-6 text-center bg-black/20 border-t border-white/5 shrink-0">
        <p className="text-slate-400 text-sm font-medium leading-relaxed">
          <span className="text-cyan-400 font-bold">Sleep het punt</span> op de
          cirkel. Zie je hoe de{" "}
          <span className="text-green-400">hoogte (y)</span> op de cirkel de{" "}
          <span className="text-green-400">waarde</span> van de grafiek wordt?
        </p>
      </div>
    </div>
  );
};
