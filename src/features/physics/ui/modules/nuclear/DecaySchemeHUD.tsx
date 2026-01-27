import React, { useMemo } from "react";

import { CUSTOM_ISOTOPE_ID, ISOTOPE_LIBRARY } from "./isotopes";

interface DecaySchemeHUDProps {
  isotopeId: string;
}

export const DecaySchemeHUD: React.FC<DecaySchemeHUDProps> = ({
  isotopeId,
}) => {
  const iso = ISOTOPE_LIBRARY[isotopeId];

  // Bepaal schaling Y-as op basis van maximale energie in het schema
  const maxEnergy = useMemo(() => {
    if (!iso || !iso.scheme) return 0;
    return Math.max(...iso.scheme.levels.map((l) => l.energy)) * 1.1; // 10% headroom
  }, [iso]);

  if (isotopeId === CUSTOM_ISOTOPE_ID) return null;
  if (!iso || !iso.scheme) return null;

  // Hulpfunctie voor Y-positie (0 = top, 100 = bottom)
  const getY = (energy: number) => {
    // Energie hoog = Y laag (bovenin)
    // Energie 0 = Y hoog (onderin)
    // We mappen [0, maxEnergy] -> [90, 10] (zodat er marge is)
    return 90 - (energy / maxEnergy) * 80;
  };

  return (
    <div className="p-4 bg-black/10 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl animate-in zoom-in-95 duration-700 w-[240px] pointer-events-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Vervalschema
        </span>
        <span className="text-[8px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded">
          E<sub>max</sub>: {maxEnergy.toFixed(2)} MeV
        </span>
      </div>

      <div className="relative h-36 w-full border-l border-b border-slate-700 p-2 overflow-visible">
        <svg
          className="w-full h-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="arrowBlue"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" />
            </marker>
            <marker
              id="arrowRed"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
            </marker>
            <marker
              id="arrowYellow"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
            </marker>
          </defs>

          {/* 1. Teken Energieniveaus */}
          {iso.scheme.levels.map((level, i) => {
            const y = getY(level.energy);
            // Moederniveau (hoogste energie, vaak index 0) links uitlijnen
            // Dochter niveaus rechts uitlijnen
            // Simpele heuristiek: Index 0 is parent
            const isParent = i === 0;
            const x1 = isParent ? 10 : 40;
            const x2 = isParent ? 40 : 90;
            const color = isParent ? "#94a3b8" : "#fbbf24"; // Slate vs Amber

            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={color}
                  strokeWidth="1.5"
                />
                <text
                  x={isParent ? x1 - 2 : x2 + 2}
                  y={y + 2}
                  fontSize="6"
                  fill={color}
                  textAnchor={isParent ? "end" : "start"}
                  fontWeight="bold"
                >
                  {level.label} (
                  {level.energy > 0 ? level.energy.toFixed(2) : "0"})
                </text>
              </g>
            );
          })}

          {/* 2. Teken Transities */}
          {iso.scheme.transitions.map((trans, i) => {
            const fromLvl = iso.scheme.levels[trans.fromLevel]!;
            const toLvl = iso.scheme.levels[trans.toLevel]!;

            const y1 = getY(fromLvl.energy);
            const y2 = getY(toLvl.energy);

            // Pijl Coordinaten
            // Beta/Alpha gaat diagonaal van Parent (links) naar Dochter (rechts)
            // Gamma gaat verticaal tussen Dochter niveaus (rechts)

            let d = "";
            let color = "";
            let marker = "";
            let dash = "";

            if (trans.particle === "gamma") {
              // Verticaal rechts
              const x = 65;
              d = `M ${x} ${y1} L ${x} ${y2}`;
              color = "#fbbf24";
              marker = "url(#arrowYellow)";
            } else {
              // Diagonaal Links -> Rechts
              const xStart = 25;
              const xEnd = 65;
              d = `M ${xStart} ${y1} L ${xEnd} ${y2}`;

              if (trans.particle === "alpha") {
                color = "#ef4444";
                marker = "url(#arrowRed)";
              } else {
                // beta / positron
                color = "#3b82f6";
                marker = "url(#arrowBlue)";
                dash = "2 2"; // Stippellijn voor beta
              }
            }

            // Offset x iets als er meerdere transities zijn (simpele shift)
            // Dit voorkomt overlap bij complexe schema's zoals Co-60
            if (trans.particle === "gamma" && i > 1) {
              // Als dit de 2e gamma is (grofweg), shift hem iets
            }

            return (
              <path
                key={`t-${i}`}
                d={d}
                stroke={color}
                strokeWidth="1"
                markerEnd={marker}
                strokeDasharray={dash}
                fill="none"
              />
            );
          })}
        </svg>
      </div>
      <div className="mt-2 border-t border-white/5 pt-1 flex justify-between">
        <span className="text-[7px] text-slate-600 italic">Waarden in MeV</span>
      </div>
    </div>
  );
};
