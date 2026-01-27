/**
 * Formulas Params Component
 */

import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type { FormulasModuleState } from "@features/math/types";
import { useTranslations } from "@shared/hooks/useTranslations";
import type { FormulaEntry } from "@shared/lib/data/formulas";
import React, { useMemo } from "react";

export const FormulasParams: React.FC = () => {
  const { t } = useTranslations();
  const [state, setState] = useModuleState<FormulasModuleState>("formulas");
  const { allFormulas } = useMathLabContext();

  // Memoize the selected formula to prevent unnecessary re-renders or stale lookups
  const selectedFormula = useMemo(() => {
    return allFormulas.find(
      (f: FormulaEntry) => f.id === state.selectedFormulaId,
    );
  }, [allFormulas, state.selectedFormulaId]);

  if (!state.selectedFormulaId) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">{t("formula.select_formula")}</p>
      </div>
    );
  }

  if (!selectedFormula) {
    return (
      <div className="text-center py-8 text-red-500">
        <p className="text-sm">Formula {state.selectedFormulaId} not found</p>
      </div>
    );
  }

  // Get variables from the selected formula
  const variables = selectedFormula.units || [];

  return (
    <div className="space-y-4 pb-20">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
        {t("formula.variables")}
      </div>

      {/* Variable Inputs */}
      {variables.map((v: { symbol: string; name: string }) => (
        <div
          key={v.symbol}
          className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${
            state.targetVar === v.symbol
              ? "bg-pink-500/5 ring-1 ring-pink-500/20"
              : ""
          }`}
        >
          <label
            className="w-12 text-sm font-mono text-pink-400 font-bold"
            title={v.name}
          >
            {v.symbol}
          </label>
          <span className="text-slate-500">=</span>
          <input
            value={state.formulaInputs[v.symbol] || ""}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                formulaInputs: {
                  ...s.formulaInputs,
                  [v.symbol]: e.target.value,
                },
              }))
            }
            placeholder="0"
            className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm font-mono text-white focus:border-pink-500 outline-none transition-all disabled:opacity-50"
            disabled={v.symbol === state.targetVar}
          />
          <button
            onClick={() => setState((s) => ({ ...s, targetVar: v.symbol }))}
            className={`px-3 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-md transition-all ${
              state.targetVar === v.symbol
                ? "bg-pink-500 text-black shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white border border-white/5"
            }`}
          >
            {state.targetVar === v.symbol ? "SOLVE" : "DOEL"}
          </button>
        </div>
      ))}

      <p className="text-[10px] text-slate-600 italic">
        {t("formula.solve_hint")}
      </p>
    </div>
  );
};
