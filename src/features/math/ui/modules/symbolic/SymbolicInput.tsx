/**
 * Symbolic Input Component
 */

import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type { SymbolicModuleState } from "@features/math/types";
import { solveCalculus } from "@shared/api/gemini";
import { useTranslations } from "@shared/hooks/useTranslations";
import { BrainCircuit, Loader2 } from "lucide-react";
import React from "react";

export const SymbolicInput: React.FC = () => {
  const { t } = useTranslations();
  const [state, setState] = useModuleState<SymbolicModuleState>("symbolic");
  const { setSolutionResult, isAiLoading, setIsAiLoading } =
    useMathLabContext();

  const handleAiSolve = async () => {
    setIsAiLoading(true);
    try {
      const result = await solveCalculus(state.expression);
      setSolutionResult({
        problem: state.expression,
        type: "derivative",
        steps: result.steps.map((step, i) => ({
          id: `step-${i}`,
          title: `Stap ${i + 1}`,
          description: step,
          latex: "",
        })),
        finalAnswer: result.finalAnswer || "",
      });
    } catch (err) {
      console.error("AI solve error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
        {t("calculus.symbolic.input_expression")}
      </div>

      <div className="relative group">
        <input
          value={state.expression}
          onChange={(e) =>
            setState((s) => ({ ...s, expression: e.target.value }))
          }
          placeholder="x^3 * sin(x)"
          className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-lg font-mono text-white focus:border-amber-500 transition-all z-10 relative"
        />

        {/* Scrubbable Hints (Wow Factor) */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 flex gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
            ✨ Live Params
          </span>
        </div>
      </div>

      {/* Detected Parameters Scrubber */}
      {state.expression.match(/\d+(\.\d+)?/g) && (
        <div className="flex flex-wrap gap-2 items-center bg-white/5 p-3 rounded-lg border border-white/5 animate-in fade-in slide-in-from-top-2">
          <span className="text-[10px] uppercase text-slate-500 font-bold mr-2">
            Parameters:
          </span>
          {Array.from(
            new Set(state.expression.match(/\d+(\.\d+)?/g) || []),
          ).map((num, i) => (
            <div
              key={`${num}-${i}`}
              className="flex items-center gap-2 bg-black/40 border border-white/10 rounded px-2 py-1 cursor-ew-resize hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-400 transition-all select-none group"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startVal = parseFloat(num);
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const diff = moveEvent.clientX - startX;
                  const step = startVal % 1 === 0 ? 1 : 0.1; // Integer vs Float step
                  const newVal = (
                    startVal +
                    Math.round(diff / 5) * step
                  ).toFixed(step === 1 ? 0 : 1);

                  // Robust replace: only replace this instance in the string if possible,
                  // but for now global replace of specific value is acceptable for "Wow" demo
                  // A smarter regex would be needed for multiple identical numbers, but this proves the concept.
                  setState((s) => ({
                    ...s,
                    expression: s.expression.replace(
                      new RegExp(num, "g"),
                      newVal,
                    ),
                  }));
                };
                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove);
                  document.removeEventListener("mouseup", handleMouseUp);
                };
                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
              }}
            >
              <span className="font-mono text-xs">{num}</span>
              <div className="w-1 h-3 bg-slate-600 rounded-full group-hover:bg-amber-500 transition-colors" />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {/* 'Derive' button removed to reduce redundancy. Operations are now centralized in SymbolicParams. */}
        <button
          onClick={handleAiSolve}
          disabled={isAiLoading}
          className="flex-1 py-3 bg-fuchsia-500/10 border border-fuchsia-500/50 hover:bg-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.2)] disabled:border-slate-700 disabled:text-slate-500 disabled:bg-transparent font-bold text-sm uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {isAiLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <BrainCircuit size={16} />
          )}
          {t("calculus.symbolic.ai_solve")}
        </button>
      </div>
    </div>
  );
};
