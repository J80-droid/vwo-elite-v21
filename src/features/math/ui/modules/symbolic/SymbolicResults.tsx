/**
 * Symbolic Results Component
 */

import { useMathLabContext } from "@features/math/hooks/useMathLabContext";
import { SolutionSteps } from "@features/math/ui/SolutionSteps";
import { useTranslations } from "@shared/hooks/useTranslations";
import React from "react";

export const SymbolicResults: React.FC = () => {
  const { t } = useTranslations();
  const { symbolicResult, solutionResult, setSolutionResult } =
    useMathLabContext();

  return (
    <div className="space-y-4 pb-20">
      {/* Quick Results */}
      {symbolicResult.derivative && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider">
            {t("calculus.symbolic.derive")}
          </span>
          <code className="block mt-1 text-white font-mono">
            {symbolicResult.derivative}
          </code>
        </div>
      )}

      {symbolicResult.integral && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <span className="text-[10px] text-purple-400 uppercase tracking-wider">
            {t("calculus.analytics.integral")}
          </span>
          <code className="block mt-1 text-white font-mono">
            {symbolicResult.integral}
          </code>
        </div>
      )}

      {/* Step-by-Step Solution */}
      {solutionResult && (
        <div className="border-t border-white/10 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              {t("calculus.symbolic.ai_solve")}
            </span>
            <button
              onClick={() => setSolutionResult(null)}
              className="text-[10px] text-slate-500 hover:text-white uppercase tracking-wider font-bold"
            >
              {t("common.close")}
            </button>
          </div>
          <SolutionSteps solution={solutionResult} />
        </div>
      )}

      {!symbolicResult.derivative &&
        !symbolicResult.integral &&
        !solutionResult && (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">
              Enter an expression and click Derive or AI Solve
            </p>
          </div>
        )}
    </div>
  );
};
