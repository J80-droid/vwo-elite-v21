/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Formulas Results Component
 */

// nerdamer imports removed for lazy loading
import { StepSolver } from "@features/math/api/StepSolver";
import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type { FormulasModuleState } from "@features/math/types";
import { SolutionSteps } from "@features/math/ui/SolutionSteps";
import { useTranslations } from "@shared/hooks/useTranslations";
import type { FormulaEntry } from "@shared/lib/data/formulas";
import { BrainCircuit, Calculator, RotateCcw } from "lucide-react";
import React from "react";

let nerdamerInstance: any = null;

async function initNerdamer() {
  if (nerdamerInstance) return nerdamerInstance;
  try {
    const n = (await import("nerdamer")).default;
    await import("nerdamer/Algebra");
    await import("nerdamer/Calculus");
    await import("nerdamer/Solve");
    nerdamerInstance = n;
    return n;
  } catch (e) {
    console.error("FormulasResults: Failed to load nerdamer", e);
    return null;
  }
}

export const FormulasResults: React.FC = () => {
  const { t } = useTranslations();
  const [state, setState] = useModuleState<FormulasModuleState>("formulas");
  const { allFormulas, solutionResult, setSolutionResult } =
    useMathLabContext();

  const handleShowSteps = async () => {
    if (!state.selectedFormulaId || !state.targetVar) return;
    const formula = allFormulas.find(
      (f: FormulaEntry) => f.id === state.selectedFormulaId,
    );
    if (!formula || !formula.symbolic) return;

    let eq = formula.symbolic;
    // Substitute known values
    Object.entries(state.formulaInputs).forEach(([key, val]) => {
      // Skip target variable, substitute others if they have a numeric value
      if (key !== state.targetVar && val && !isNaN(parseFloat(val))) {
        const regex = new RegExp(`\\b${key}\\b`, "g");
        eq = eq.replace(regex, val);
      }
    });

    // StepSolver is assumed to be synchronous or handle its own loading
    const res = await StepSolver.solve(eq, "roots", state.targetVar, t);
    setSolutionResult(res);
  };

  const calculate = async () => {
    if (!state.selectedFormulaId || !state.targetVar) return;

    const formula = allFormulas.find(
      (f: FormulaEntry) => f.id === state.selectedFormulaId,
    );
    if (!formula) return;

    const { targetVar, formulaInputs } = state;

    try {
      // Determine if the target variable is the "natural" output of the calculate function
      const primaryUnit = formula.units.find(
        (u: { input: boolean }) => !u.input,
      );
      const isPrimaryTarget = primaryUnit && targetVar === primaryUnit.symbol;

      // Priority 1: Use pre-defined calculate function if available AND it matches targetVar
      if (formula.calculate && isPrimaryTarget) {
        const numericInputs: Record<string, number> = {};
        formula.units.forEach((unit: { symbol: string }) => {
          const val = parseFloat(formulaInputs[unit.symbol] || "0");
          numericInputs[unit.symbol] = val;
        });

        const result = formula.calculate(numericInputs);
        if (isNaN(result) || !isFinite(result)) {
          setState((s) => ({ ...s, calculatedResult: "Geen oplossing" }));
        } else {
          setState((s) => ({ ...s, calculatedResult: result.toFixed(4) }));
        }
        return;
      }

      // Priority 2: Use Nerdamer for symbolic solving
      if (formula.symbolic) {
        const n = await initNerdamer();
        if (!n) {
          setState((s) => ({ ...s, calculatedResult: "Dienst laden..." }));
          return;
        }

        const eq = formula.symbolic;
        const solved = (n as any).solve(eq, targetVar);
        const solutionStr = solved.toString();

        if (solutionStr === "[]" || !solutionStr) {
          setState((s) => ({ ...s, calculatedResult: "Geen oplossing" }));
          return;
        }

        const mainSolution = solutionStr.startsWith("[")
          ? solutionStr.slice(1, -1).split(",")[0]
          : solutionStr;
        const finalResult = (n as any)(mainSolution)
          .evaluate(formulaInputs)
          .text();
        const numericRes = parseFloat(finalResult);

        if (isNaN(numericRes)) {
          setState((s) => ({ ...s, calculatedResult: "Geen reële opl." }));
        } else {
          setState((s) => ({ ...s, calculatedResult: numericRes.toFixed(4) }));
        }
      } else {
        setState((s) => ({
          ...s,
          calculatedResult: "Selecteer hoofduitkomst",
        }));
      }
    } catch (err) {
      console.error("Calculation error:", err);
      setState((s) => ({ ...s, calculatedResult: "Fout" }));
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Calculate Button */}
      <button
        onClick={calculate}
        disabled={!state.selectedFormulaId || !state.targetVar}
        className="w-full py-3 bg-transparent border border-pink-500/20 hover:border-pink-500/60 hover:bg-pink-500/5 disabled:opacity-20 disabled:cursor-not-allowed text-pink-400 font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <Calculator
          size={14}
          className="group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
        />
        {t("formula.calculate")}
      </button>

      {/* Step Solver Button */}
      <button
        onClick={handleShowSteps}
        disabled={!state.selectedFormulaId || !state.targetVar}
        className="w-full py-2 bg-transparent border border-cyan-500/20 hover:border-cyan-500/60 hover:bg-cyan-500/5 disabled:opacity-20 disabled:cursor-not-allowed text-cyan-400 font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
      >
        <BrainCircuit size={14} />
        {t("common.step_solver") || "Toon Berekening"}
      </button>

      {/* Result Display */}
      {state.calculatedResult && (
        <div className="p-4 bg-black/40 border border-white/10 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              {t("formula.result")}
            </span>
            <button
              onClick={() =>
                setState((s) => ({ ...s, calculatedResult: null }))
              }
              className="p-1 text-slate-600 hover:text-white transition-all"
            >
              <RotateCcw size={10} />
            </button>
          </div>
          <div className="flex items-baseline justify-center gap-2 py-2">
            <span className="text-slate-400 font-mono text-sm">
              {state.targetVar} ={" "}
            </span>
            <span className="text-white font-mono text-xl font-bold">
              {state.calculatedResult}
            </span>
          </div>
        </div>
      )}

      {solutionResult && (
        <div className="mt-4 border-t border-white/10 pt-4 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-2">
              <BrainCircuit size={12} />
              Stap-voor-stap
            </span>
            <button
              onClick={() => setSolutionResult(null)}
              className="text-[10px] text-slate-500 hover:text-white"
            >
              Sluiten
            </button>
          </div>
          <SolutionSteps solution={solutionResult} />
        </div>
      )}

      {!state.selectedFormulaId && (
        <div className="text-center py-8 text-slate-600">
          <p className="text-xs">{t("formula.no_formula")}</p>
        </div>
      )}
    </div>
  );
};
