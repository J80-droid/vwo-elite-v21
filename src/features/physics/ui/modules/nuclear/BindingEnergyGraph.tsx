import React, { useMemo } from "react";

import { CUSTOM_ISOTOPE_ID, ISOTOPE_LIBRARY } from "./isotopes";

interface BindingEnergyGraphProps {
  isotopeId: string;
}

// 100% Real data points (A vs MeV/nucleon)
// Bron: AME2020 (Atomic Mass Evaluation)
const REFERENCE_CURVE = [
  { A: 1, be: 0 },
  { A: 2, be: 1.112 }, // H-2 (Deuterium)
  { A: 3, be: 2.572 }, // H-3
  { A: 4, be: 7.073 }, // He-4 (Zeer stabiel!)
  { A: 6, be: 5.332 }, // Li-6
  { A: 12, be: 7.68 }, // C-12
  { A: 16, be: 7.976 }, // O-16
  { A: 40, be: 8.551 }, // Ca-40
  { A: 56, be: 8.79 }, // Fe-56 (Piek Stabiliteit)
  { A: 84, be: 8.719 }, // Kr-84
  { A: 120, be: 8.505 }, // Sn-120
  { A: 197, be: 7.916 }, // Au-197
  { A: 238, be: 7.57 }, // U-238
];

export const BindingEnergyGraph: React.FC<BindingEnergyGraphProps> = ({
  isotopeId,
}) => {
  // Genereer SVG pad door de echte datapunten
  const pathD = useMemo(() => {
    // Schaal: X (0-240), Y (0-9 MeV)
    const scaleX = (a: number) => (a / 240) * 100;
    const scaleY = (e: number) => 100 - (e / 9.5) * 100;

    // Cubic Bézier smoothing tussen punten voor mooie curve
    let d = `M ${scaleX(REFERENCE_CURVE[0]!.A)} ${scaleY(REFERENCE_CURVE[0]!.be)}`;

    for (let i = 0; i < REFERENCE_CURVE.length - 1; i++) {
      const p1 = REFERENCE_CURVE[i + 1]!;
      d += ` L ${scaleX(p1.A)} ${scaleY(p1.be)}`;
    }
    return d;
  }, []);

  // Haal de ECHTE data op uit de library
  const currentPoint = useMemo(() => {
    if (isotopeId === CUSTOM_ISOTOPE_ID) return null;
    const iso = ISOTOPE_LIBRARY[isotopeId];
    if (!iso) return null;

    const x = (iso.mass / 240) * 100;
    const y = 100 - (iso.bindingEnergyPerNucleon / 9.5) * 100;

    return { x, y, val: iso.bindingEnergyPerNucleon };
  }, [isotopeId]);

  return (
    <div className="p-3 bg-black/10 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl animate-in fade-in slide-in-from-left-4 duration-700 pointer-events-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Bindingsenergie / A
        </span>
        {currentPoint && (
          <span className="bg-blue-500/10 text-blue-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-blue-500/20">
            {currentPoint.val.toFixed(2)} MeV
          </span>
        )}
      </div>

      <div className="relative w-full h-24 bg-black/20 rounded-lg overflow-hidden border border-white/5">
        <svg
          className="w-full h-full p-2 overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Grid Lines */}
          <line
            x1="0"
            y1="100"
            x2="100"
            y2="100"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="100"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
          />

          {/* Gradient Zones */}
          <rect
            x="0"
            y="0"
            width="23"
            height="100"
            fill="url(#fusionGradient)"
            opacity="0.1"
          />
          <rect
            x="23"
            y="0"
            width="77"
            height="100"
            fill="url(#fissionGradient)"
            opacity="0.1"
          />

          <defs>
            <linearGradient id="fusionGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="fissionGradient" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Curve of Stability (Based on Real Data) */}
          <path
            d={pathD}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Datapoint Markers (Referentie nucleïden) */}
          {REFERENCE_CURVE.map((p) => (
            <circle
              key={p.A}
              cx={(p.A / 240) * 100}
              cy={100 - (p.be / 9.5) * 100}
              r="1"
              fill="#475569"
            />
          ))}

          {/* Peak Marker (Fe-56) */}
          <line
            x1={(56 / 240) * 100}
            y1={100 - (8.79 / 9.5) * 100}
            x2={(56 / 240) * 100}
            y2={100}
            stroke="#fbbf24"
            strokeWidth="0.5"
            strokeDasharray="1 1"
            opacity="0.4"
          />

          {/* Current Isotope Indicator */}
          {currentPoint && (
            <>
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r="3"
                fill="#3b82f6"
                className="animate-pulse"
              />
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r="8"
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="0.5"
                opacity="0.5"
              />
              <line
                x1={currentPoint.x}
                y1={currentPoint.y}
                x2={currentPoint.x}
                y2="100"
                stroke="#3b82f6"
                strokeWidth="0.5"
                strokeDasharray="1 1"
              />
            </>
          )}
        </svg>

        {/* Labels */}
        <span className="absolute top-[5%] left-[24%] text-[7px] text-yellow-500/80 font-bold">
          Fe-56
        </span>
        <span className="absolute bottom-1 left-2 text-[7px] text-emerald-400 font-bold uppercase tracking-widest opacity-80">
          Fusie Winst
        </span>
        <span className="absolute bottom-1 right-2 text-[7px] text-rose-400 font-bold uppercase tracking-widest opacity-80">
          Splijting Winst
        </span>
      </div>
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[6px] text-slate-600 font-mono">0</span>
        <span className="text-[6px] text-slate-600 font-mono uppercase tracking-widest">
          Massagetal (A)
        </span>
        <span className="text-[6px] text-slate-600 font-mono">240</span>
      </div>
    </div>
  );
};
