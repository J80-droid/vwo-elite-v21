/**
 * ThreeD Input Component
 */

import { useMathLabContext } from "@features/math/hooks/useMathLabContext";
import { useTranslations } from "@shared/hooks/useTranslations";
import { RefreshCw } from "lucide-react";
import React from "react";

const PRESETS = [
  {
    id: "paraboloid",
    label: "Paraboloid",
    fn: "x^2 + y^2",
    color: "text-purple-400",
    border: "border-purple-500/50",
    bg: "bg-purple-500/10",
    shadow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]",
  },
  {
    id: "saddle",
    label: "Saddle",
    fn: "x^2 - y^2",
    color: "text-orange-400",
    border: "border-orange-500/50",
    bg: "bg-orange-500/10",
    shadow: "shadow-[0_0_15px_rgba(251,146,60,0.2)]",
  },
  {
    id: "wave",
    label: "Wave",
    fn: "sin(x) * cos(y)",
    color: "text-cyan-400",
    border: "border-cyan-500/50",
    bg: "bg-cyan-500/10",
    shadow: "shadow-[0_0_15px_rgba(34,211,238,0.2)]",
  },
  {
    id: "ripple",
    label: "Ripple",
    fn: "sin(sqrt(x^2 + y^2))",
    color: "text-blue-400",
    border: "border-blue-500/50",
    bg: "bg-blue-500/10",
    shadow: "shadow-[0_0_15px_rgba(96,165,250,0.2)]",
  },
  {
    id: "gaussian",
    label: "Gaussian",
    fn: "exp(-(x^2 + y^2)/2)",
    color: "text-emerald-400",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10",
    shadow: "shadow-[0_0_15px_rgba(52,211,153,0.2)]",
  },
  {
    id: "spiral",
    label: "Spiral",
    fn: "sin(x*y)",
    color: "text-pink-400",
    border: "border-pink-500/50",
    bg: "bg-pink-500/10",
    shadow: "shadow-[0_0_15px_rgba(244,114,182,0.2)]",
  },
];

export const ThreeDInput: React.FC = () => {
  const { t } = useTranslations();
  const { rawFunctions, setRawFunctions } = useMathLabContext();

  const expression = rawFunctions[0] || "sin(sqrt(x^2 + y^2))";
  const setExpression = (expr: string) => {
    const newFns = [...rawFunctions];
    newFns[0] = expr;
    setRawFunctions(newFns);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
        Z = f(X, Y)
      </div>

      {/* Expression Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-mono font-bold">
          z =
        </span>
        <input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="x^2 + y^2"
          className="w-full bg-black/40 border border-white/10 rounded-lg pl-12 pr-4 py-4 text-lg font-mono text-white focus:border-purple-500 transition-all"
        />
      </div>

      {/* Presets */}
      <div className="mt-4">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-2">
          {t("calculus.threed.presets.title")}
        </span>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setExpression(preset.fn)}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                expression === preset.fn
                  ? `${preset.bg} ${preset.color} ${preset.border} ${preset.shadow}`
                  : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white"
              }`}
            >
              {t(`calculus.threed.presets.${preset.id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => setExpression("sin(sqrt(x^2 + y^2))")}
        className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all text-xs flex items-center justify-center gap-2 mt-4"
      >
        <RefreshCw size={12} />
        {t("common.reset")}
      </button>
    </div>
  );
};
