import "mafs/core.css";

import { Move, Navigation } from "lucide-react";
import { Coordinates, Mafs, useMovablePoint, Vector } from "mafs";
import React from "react";

export const ConceptVector: React.FC = () => {
  // Draggable point for Vector U
  const pointU = useMovablePoint([2, 1], {
    color: "#10b981", // Emerald-500
  });

  // Draggable point for Vector V
  const pointV = useMovablePoint([1, 2], {
    color: "#3b82f6", // Blue-500
  });

  // Sum vector
  const sumVec = [pointU.x + pointV.x, pointU.y + pointV.y];

  // Dot product
  const dotProduct = pointU.x * pointV.x + pointU.y * pointV.y;

  // Magnitudes
  const magU = Math.sqrt(pointU.x ** 2 + pointU.y ** 2);
  const magV = Math.sqrt(pointV.x ** 2 + pointV.y ** 2);

  // Angle in degrees
  const denominator = magU * magV;
  const angleRad =
    denominator > 0.001
      ? Math.acos(Math.min(1, Math.max(-1, dotProduct / denominator)))
      : 0;
  const angleDeg = (angleRad * 180) / Math.PI;

  return (
    <div className="h-full flex flex-col bg-obsidian-950 font-outfit text-white overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-black/20 backdrop-blur-md gap-4">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Navigation size={20} className="text-blue-400" />
            Vector Voyager
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Meetkunde met Coördinaten
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
            <span className="text-[9px] uppercase font-black text-emerald-500 block mb-1">
              Vector u
            </span>
            <span className="font-mono text-white text-lg tabular-nums font-bold">
              ({pointU.x.toFixed(1)}, {pointU.y.toFixed(1)})
            </span>
          </div>
          <div className="px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
            <span className="text-[9px] uppercase font-black text-blue-500 block mb-1">
              Vector v
            </span>
            <span className="font-mono text-white text-lg tabular-nums font-bold">
              ({pointV.x.toFixed(1)}, {pointV.y.toFixed(1)})
            </span>
          </div>
          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-[9px] uppercase font-black text-slate-500 block mb-1">
              Inproduct
            </span>
            <span
              className={`font-mono text-lg tabular-nums font-bold ${Math.abs(dotProduct) < 0.1 ? "text-rose-400 animate-pulse" : "text-white"}`}
            >
              {dotProduct.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Visualisatie Stage */}
      <div className="flex-1 relative m-4 flex flex-col gap-4 shrink-0 min-h-[500px]">
        <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden shadow-inner group">
          <div className="absolute top-4 left-4 z-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Visualisatie: Kop-aan-Staart vs Som
          </div>

          <Mafs viewBox={{ x: [-1, 6], y: [-1, 6] }} pan={true}>
            <Coordinates.Cartesian />

            {/* Vector U */}
            <Vector
              tail={[0, 0]}
              tip={[pointU.x, pointU.y]}
              color="#10b981"
              weight={3}
            />

            {/* Vector V */}
            <Vector
              tail={[0, 0]}
              tip={[pointV.x, pointV.y]}
              color="#3b82f6"
              weight={3}
            />

            {/* Kop-aan-Staart Visualisatie */}
            <Vector
              tail={[pointU.x, pointU.y]}
              tip={[sumVec[0]!, sumVec[1]!]}
              color="#3b82f6"
              opacity={0.3}
              style="dashed"
            />

            {/* Somvector */}
            <Vector
              tail={[0, 0]}
              tip={[sumVec[0]!, sumVec[1]!]}
              color="#f59e0b"
              weight={4}
            />

            {/* Points */}
            {pointU.element}
            {pointV.element}

            {/* Labels */}
            <text
              x={pointU.x / 2 - 0.3}
              y={pointU.y / 2 + 0.3}
              fill="#10b981"
              fontSize={16}
              fontWeight="900"
              fontStyle="italic"
            >
              u
            </text>
            <text
              x={pointV.x / 2 + 0.3}
              y={pointV.y / 2 - 0.3}
              fill="#3b82f6"
              fontSize={16}
              fontWeight="900"
              fontStyle="italic"
            >
              v
            </text>
            <text
              x={sumVec[0]! / 2 + 0.4}
              y={sumVec[1]! / 2 + 0.4}
              fill="#f59e0b"
              fontSize={16}
              fontWeight="900"
              fontStyle="italic"
            >
              u+v
            </text>
          </Mafs>
        </div>

        {/* Info Panel */}
        <div className="h-24 bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between gap-12">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">
                Hoek (θ)
              </span>
              <span
                className={`text-xl font-bold font-mono ${Math.abs(angleDeg - 90) < 2 ? "text-rose-400" : "text-white"}`}
              >
                {angleDeg.toFixed(1)}°
              </span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">
                Inproduct Formule
              </span>
              <span className="text-xs font-medium text-slate-400 italic">
                u · v = |u| * |v| * cos(θ)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
            <Move size={14} className="text-blue-400" />
            Sleep de <span className="text-emerald-400 font-bold">
              groene
            </span>{" "}
            en <span className="text-blue-400 font-bold">blauwe</span> punten.
          </div>
        </div>
      </div>

      {/* Inzicht Footer */}
      <div className="p-4 text-center bg-black/20 border-t border-white/5">
        <p className="text-slate-400 text-sm italic">
          Focus: Probeer de hoek exact op{" "}
          <span className="text-rose-400 font-black">90.0°</span> te krijgen.
          Wat gebeurt er met het inproduct?
        </p>
      </div>
    </div>
  );
};
