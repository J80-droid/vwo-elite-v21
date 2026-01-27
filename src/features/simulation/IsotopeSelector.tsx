import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { ElementData } from "./data/PeriodicData";

interface IsotopeSelectorProps {
  element: ElementData;
}

export const IsotopeSelector: React.FC<IsotopeSelectorProps> = ({
  element,
}) => {
  const { t } = useTranslation("chemistry");
  const [selectedIsoIndex, setSelectedIsoIndex] = useState(0);

  if (!element.isotopes || element.isotopes.length === 0) return null;

  const currentIso = element.isotopes![selectedIsoIndex]!;

  return (
    <div className="bg-slate-900/40 p-3 rounded-xl border border-white/10 mt-4">
      <h3 className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">
        {t("periodic_table.isotopes_stability")}
      </h3>

      <div className="flex gap-2 mb-3 overflow-x-auto custom-scrollbar pb-2">
        {element.isotopes.map((iso, idx) => (
          <button
            key={iso.mass}
            onClick={() => setSelectedIsoIndex(idx)}
            className={`
                            px-2 py-1 rounded text-xs font-mono font-bold border transition-all whitespace-nowrap
                            ${
                              selectedIsoIndex === idx
                                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                                : "bg-slate-800/50 border-white/5 text-slate-500 hover:text-slate-300"
                            }
                        `}
          >
            {element.symbol}-{iso.mass}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-white/5 p-2 rounded border border-white/5">
          <div className="text-slate-500 mb-1">
            {t("periodic_table.natural_abundance")}
          </div>
          <div className="text-white font-mono font-bold">
            {currentIso.abundance > 0
              ? `${currentIso.abundance}%`
              : t("periodic_table.synthetic")}
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded border border-white/5">
          <div className="text-slate-500 mb-1">
            {t("periodic_table.half_life")}
          </div>
          <div
            className={`font-mono font-bold ${currentIso.halfLife ? "text-rose-400" : "text-emerald-400"}`}
          >
            {currentIso.halfLife || t("periodic_table.stable")}
          </div>
        </div>
        {currentIso.decay && (
          <div className="col-span-2 bg-rose-500/10 p-2 rounded border border-rose-500/20 flex justify-between items-center">
            <span className="text-rose-300">
              {t("periodic_table.decay_mode")}
            </span>
            <span className="font-bold text-rose-400 font-mono">
              {currentIso.decay}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
