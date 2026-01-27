import React, { useMemo } from "react";

import { CUSTOM_ISOTOPE_ID, ISOTOPE_LIBRARY } from "./isotopes";

interface BiologicalRangeHUDProps {
  isotopeId: string;
}

export const BiologicalRangeHUD: React.FC<BiologicalRangeHUDProps> = ({
  isotopeId,
}) => {
  const ranges = useMemo(() => {
    // Defaults voor Custom Isotoop
    if (isotopeId === CUSTOM_ISOTOPE_ID) {
      return {
        alpha: { width: 5, label: "0.05 mm" },
        beta: { width: 40, label: "~5 mm" },
        gamma: { width: 100, label: "> 15 cm" },
      };
    }

    const iso = ISOTOPE_LIBRARY[isotopeId];

    // Fallback als er iets mis is met de data, hoewel types dit zouden moeten voorkomen
    if (!iso || !iso.specs)
      return {
        alpha: { width: 0, label: "-" },
        beta: { width: 0, label: "-" },
        gamma: { width: 0, label: "-" },
      };

    // Direct uit de data! Geen logica meer in de view.
    return iso.specs.range;
  }, [isotopeId]);

  // Statische kleuren en beschrijvingen (die veranderen niet per isotoop)
  const staticConfig = {
    alpha: { color: "#ef4444", desc: "Huid / Papier" },
    beta: { color: "#3b82f6", desc: "Spierweefsel" },
    gamma: { color: "#fbbf24", desc: "Hele lichaam" },
  };

  return (
    <div className="p-3 bg-black/10 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl animate-in fade-in slide-in-from-top-4 duration-700 w-[260px] pointer-events-auto">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Penetratievermogen
        </span>
        <span className="text-[8px] font-bold text-rose-500/80 uppercase tracking-widest font-mono">
          Bio-Impact
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {(["alpha", "beta", "gamma"] as const).map((type) => {
          const rSpec = ranges[type];
          const config = staticConfig[type];

          return (
            <div key={type} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black text-white uppercase tracking-tighter flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {type === "alpha"
                    ? "Alfa"
                    : type === "beta"
                      ? "Beta"
                      : "Gamma"}
                </span>
                <span className="text-[8px] font-mono text-slate-400">
                  {rSpec.label}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex items-center">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${rSpec.width}%`,
                    backgroundColor: config.color,
                    boxShadow: `0 0 10px ${config.color}40`,
                    opacity: rSpec.width > 0 ? 1 : 0,
                  }}
                />
              </div>
              <span className="text-[7px] text-slate-500 italic uppercase tracking-widest">
                {config.desc}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-white/5 pt-2">
        <p className="text-[7px] text-slate-500 leading-tight">
          Dracht in zacht biologisch weefsel. Gamma wordt nooit volledig gestopt
          (halfwaardendikte).
        </p>
      </div>
    </div>
  );
};
