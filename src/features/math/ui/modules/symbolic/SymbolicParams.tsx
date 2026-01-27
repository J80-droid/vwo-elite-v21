/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Symbolic Params Component
 */

import { StepSolver } from "@features/math/api/StepSolver";
import { useMathLabContext } from "@features/math/hooks/useMathLabContext";
import { useTranslations } from "@shared/hooks/useTranslations";
import React from "react";

export const SymbolicParams: React.FC = () => {
  const { t } = useTranslations();
  const { symbolicFn, setSolutionResult } = useMathLabContext();

  const [integralBounds, setIntegralBounds] = React.useState({
    lower: "0",
    upper: "1",
  });
  const [limitTarget, setLimitTarget] = React.useState("0"); // x -> ?

  const handleOperation = async (op: string) => {
    let solverOp = op;
    if (op === "differentiate") solverOp = "derivative";
    if (op === "lhopital") solverOp = "limit";

    // Pass extra options to solver
    const options = {
      lower: integralBounds.lower,
      upper: integralBounds.upper,
      limitTo: limitTarget,
    };

    const result = await StepSolver.solve(
      symbolicFn,
      solverOp as any,
      "x",
      t,
      options,
    );
    setSolutionResult(result);
  };

  const opStyles: Record<string, string> = {
    derivative:
      "bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.1)]",
    integral:
      "bg-violet-500/5 hover:bg-violet-500/10 border-violet-500/30 hover:border-violet-500/50 text-violet-400 hover:shadow-[0_0_10px_rgba(139,92,246,0.1)]",
    definite_integral:
      "bg-fuchsia-500/5 hover:bg-fuchsia-500/10 border-fuchsia-500/30 hover:border-fuchsia-500/50 text-fuchsia-400 hover:shadow-[0_0_10px_rgba(217,70,239,0.1)]",
    limit:
      "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50 text-blue-400 hover:shadow-[0_0_10px_rgba(59,130,246,0.1)]",
    simplify:
      "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    factor:
      "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 text-amber-400 hover:shadow-[0_0_10px_rgba(245,158,11,0.1)]",
    exam_trainer:
      "bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50 text-orange-400 hover:shadow-[0_0_10px_rgba(249,115,22,0.1)]",
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Standard Operations */}
      <div className="space-y-4">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          {t("calculus.symbolic.operations")}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["derivative", "integral", "simplify", "factor"].map((op) => (
            <button
              key={op}
              onClick={() => handleOperation(op)}
              className={`py-3 px-4 border rounded-lg text-sm transition-all capitalize font-medium ${opStyles[op] || opStyles.derivative}`}
            >
              {t(
                `calculus.symbolic_ops.${op === "derivative" ? "differentiate" : op === "integral" ? "integrate" : op}`,
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced VWO Operations */}
      <div className="space-y-4">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          VWO B/D {t("calculus.symbolic.advanced") || "Advanced"}
        </div>

        {/* Limits */}
        <div className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/10">
          <span className="text-sm text-slate-400 font-mono">lim x→</span>
          <input
            value={limitTarget}
            onChange={(e) => setLimitTarget(e.target.value)}
            className="bg-black/50 border border-white/10 rounded px-2 py-1 w-12 text-center text-sm"
            placeholder="0"
          />
          <button
            onClick={() => handleOperation("limit")}
            className={`flex-1 py-1.5 px-3 border rounded text-xs uppercase tracking-wider ${opStyles.limit}`}
          >
            {t("calculus.symbolic_ops.limit") || "Limiet"}
          </button>
        </div>

        {/* Definite Integral */}
        <div className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="flex flex-col gap-1">
            <input
              value={integralBounds.upper}
              onChange={(e) =>
                setIntegralBounds({ ...integralBounds, upper: e.target.value })
              }
              className="bg-black/50 border border-white/10 rounded px-1 py-0.5 w-8 text-center text-xs"
              placeholder="b"
            />
            <span className="text-lg leading-none text-slate-500">∫</span>
            <input
              value={integralBounds.lower}
              onChange={(e) =>
                setIntegralBounds({ ...integralBounds, lower: e.target.value })
              }
              className="bg-black/50 border border-white/10 rounded px-1 py-0.5 w-8 text-center text-xs"
              placeholder="a"
            />
          </div>
          <button
            onClick={() => handleOperation("definite_integral")}
            className={`flex-1 py-3 px-3 border rounded text-xs uppercase tracking-wider ${opStyles.definite_integral}`}
          >
            {t("calculus.symbolic_ops.definite_integral") ||
              "Bepaalde Integraal"}
          </button>
        </div>

        {/* L'Hôpital Rule (V2.1) */}
        <div className="flex gap-2 items-center bg-gradient-to-r from-rose-500/5 to-pink-500/5 p-3 rounded-lg border border-rose-500/20">
          <div className="flex-1">
            <div className="text-[9px] text-rose-400 uppercase font-bold mb-1">
              {t("calculus.symbolic_ops.lhopital")}
            </div>
            <div className="text-[9px] text-rose-400/60">
              {t("calculus.symbolic_ops.lhopital_desc")}
            </div>
          </div>
          <button
            onClick={() => handleOperation("lhopital")}
            className="py-2 px-4 border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs uppercase tracking-wider transition-all font-bold shadow-[0_0_10px_rgba(244,63,94,0.1)] hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]"
          >
            f'/g'
          </button>
        </div>
      </div>

      {/* Didactic Tools */}
      <div className="space-y-2 pt-4 border-t border-white/10">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          Didactiek
        </div>
        <button
          onClick={() => handleOperation("spot_error")}
          className="w-full py-2 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg text-xs uppercase tracking-wider transition-all"
        >
          🐞 Spot the Error Mode
        </button>
        <button
          onClick={() => handleOperation("exam_trainer")}
          className={`w-full py-2 border rounded-lg text-xs uppercase tracking-wider transition-all ${opStyles.exam_trainer}`}
        >
          🎓 {t("calculus.exam_trainer_btn") || "Examen Trainer"}
        </button>
      </div>
      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
          {t("calculus.symbolic.tips.title")}
        </p>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>{t("calculus.symbolic.tips.power")}</li>
          <li>{t("calculus.symbolic.tips.mult")}</li>
          <li>{t("calculus.symbolic.tips.trig")}</li>
          <li>{t("calculus.symbolic.tips.log")}</li>
        </ul>
      </div>
    </div>
  );
};
