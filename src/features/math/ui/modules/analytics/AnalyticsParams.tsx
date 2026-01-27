/**
 * Analytics Params Component
 *
 * Parameter sliders and animation controls.
 */

import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type { AnalyticsModuleState } from "@features/math/types";
import { useTranslations } from "@shared/hooks/useTranslations";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import React, { useEffect, useRef } from "react";

export const AnalyticsParams: React.FC = () => {
  const { t } = useTranslations();
  const {
    parameters,
    setParameters,
    animatingParams,
    setAnimatingParams,
    isSonifying,
    setIsSonifying,
    setScannerX,
    processedFunctions,
  } = useMathLabContext();

  const [state, setState] = useModuleState<AnalyticsModuleState>("analytics");

  const animatingRef = useRef<Record<string, boolean>>({});

  // Sync ref with state for animation loop
  useEffect(() => {
    animatingRef.current = animatingParams;
  }, [animatingParams]);

  const toggleAnimation = (param: string) => {
    const wasAnimating = animatingParams[param];
    setAnimatingParams((prev) => ({ ...prev, [param]: !prev[param] }));

    if (!wasAnimating) {
      const animate = () => {
        if (!animatingRef.current[param]) return;
        setParameters((prev) => ({
          ...prev,
          [param]:
            (prev[param] || 0) + 0.02 > 5 ? -5 : (prev[param] || 0) + 0.02,
        }));
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  };

  const toggleSonification = async () => {
    if (isSonifying) {
      setIsSonifying(false);
      setScannerX(null);
    } else {
      if (!processedFunctions[0]) return;
      // Let the global MathLabModern component handle the oscillator
      setIsSonifying(true);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          {t("calculus.analytics.parameters")}
        </span>
        <button
          onClick={() => setParameters({ a: 1, b: 0, c: 1, k: 1 })}
          className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-all"
          title="Reset parameters"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Parameter Sliders */}
      {Object.keys(parameters)
        .filter(
          (key) =>
            ![
              "m11",
              "m12",
              "m13",
              "m21",
              "m22",
              "m23",
              "m31",
              "m32",
              "m33",
            ].includes(key),
        )
        .map((key) => (
          <div key={key} className="group">
            <div className="flex items-center gap-3">
              <span className="font-mono text-cyan-400 font-bold w-4">
                {key}
              </span>
              <input
                type="range"
                min={-5}
                max={5}
                step={0.1}
                value={parameters[key]}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    [key]: parseFloat(e.target.value),
                  })
                }
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
              <span className="font-mono text-white font-bold w-10 text-right text-xs">
                {(parameters[key] || 0).toFixed(1)}
              </span>
              <button
                onClick={() => toggleAnimation(key)}
                className={`p-1.5 rounded transition-all ${
                  animatingParams[key]
                    ? "bg-cyan-500 text-black"
                    : "bg-white/10 text-slate-400 hover:text-white"
                }`}
                title={
                  animatingParams[key] ? "Stop animation" : "Animate parameter"
                }
              >
                {animatingParams[key] ? (
                  <Pause size={12} />
                ) : (
                  <Play size={12} />
                )}
              </button>
            </div>
          </div>
        ))}

      {/* Sonification Control */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={toggleSonification}
          disabled={state.plotMode !== "cartesian"}
          className={`w-full py-3 flex items-center justify-center gap-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all border ${
            isSonifying
              ? "bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              : state.plotMode === "cartesian"
                ? "bg-white/5 border border-transparent text-slate-400 hover:bg-white/10 hover:text-white"
                : "bg-white/5 border-transparent text-slate-600 cursor-not-allowed"
          }`}
        >
          {isSonifying ? (
            <>
              <VolumeX size={16} /> {t("calculus.stop_audio")}
            </>
          ) : (
            <>
              <Volume2 size={16} /> {t("calculus.sonify_function")}
            </>
          )}
        </button>
        {state.plotMode !== "cartesian" && (
          <p className="text-[9px] text-slate-600 text-center mt-1 italic">
            Only available in Cartesian mode
          </p>
        )}
      </div>

      {/* Didactic Tools (V2.0) */}
      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          Didactische Tools (V2.0)
        </span>

        {/* Riemann Sums */}
        <div className="space-y-2 p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-medium">
              {t("calculus.analytics.didactic.riemann")}
            </span>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  showRiemann: !prev.showRiemann,
                }))
              }
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all border ${
                state.showRiemann
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {state.showRiemann ? "Aan" : "Uit"}
            </button>
          </div>
          {state.showRiemann && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  {t("calculus.analytics.didactic.type")}
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {(
                    [
                      "left",
                      "midpoint",
                      "right",
                      "trapezoidal",
                      "simpson",
                    ] as const
                  ).map((type) => {
                    const colors: Record<
                      string,
                      { active: string; label: string }
                    > = {
                      left: {
                        active:
                          "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                        label: "L",
                      },
                      midpoint: {
                        active:
                          "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                        label: "M",
                      },
                      right: {
                        active:
                          "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                        label: "R",
                      },
                      trapezoidal: {
                        active:
                          "bg-blue-500/20 text-blue-400 border-blue-500/30",
                        label: "Trap",
                      },
                      simpson: {
                        active:
                          "bg-purple-500/20 text-purple-400 border-purple-500/30",
                        label: "Simp",
                      },
                    };
                    return (
                      <button
                        key={type}
                        onClick={() =>
                          setState((prev) => ({ ...prev, riemannType: type }))
                        }
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all border ${
                          state.riemannType === type
                            ? colors[type]!.active
                            : "bg-white/5 border-transparent text-slate-500 hover:text-white"
                        }`}
                      >
                        {colors[type]!.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-1">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-500 uppercase font-bold">
                    {t("calculus.analytics.didactic.interval")}
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {state.riemannIntervals ?? 10}
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="100"
                  step="2"
                  value={state.riemannIntervals ?? 10}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      riemannIntervals: parseInt(e.target.value),
                    }))
                  }
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tangent Line */}
        <div className="space-y-2 p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-medium">
              {t("calculus.analytics.didactic.tangent")}
            </span>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  showTangent: !prev.showTangent,
                }))
              }
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all border ${
                state.showTangent
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  : "bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {state.showTangent ? "Aan" : "Uit"}
            </button>
          </div>
          {state.showTangent && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  {t("calculus.analytics.didactic.animate")}
                </span>
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      isTangentAnimating: !prev.isTangentAnimating,
                    }))
                  }
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all border ${
                    state.isTangentAnimating
                      ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                      : "bg-white/5 border-transparent text-slate-500 hover:text-white"
                  }`}
                >
                  {state.isTangentAnimating ? "Stop" : "Play"}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 size={12} className="text-slate-500" />
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={state.tangentSpeed ?? 1}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      tangentSpeed: parseFloat(e.target.value),
                    }))
                  }
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] text-white font-mono w-6">
                  {state.tangentSpeed ?? 1}x
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Unit Circle */}
        <div className="space-y-2 p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-medium">
              {t("calculus.analytics.didactic.unit_circle")}
            </span>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  showUnitCircle: !prev.showUnitCircle,
                }))
              }
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all border ${
                state.showUnitCircle
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  : "bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {state.showUnitCircle ? "Aan" : "Uit"}
            </button>
          </div>
          {state.showUnitCircle && (
            <div className="flex gap-1 pt-2">
              {(["standard", "components"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    setState((prev) => ({ ...prev, unitCircleMode: mode }))
                  }
                  className={`flex-1 py-1 rounded text-[9px] font-bold uppercase transition-all border ${
                    state.unitCircleMode === mode
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-white/5 border-transparent text-slate-500 hover:text-white"
                  }`}
                >
                  {mode === "standard"
                    ? t("calculus.analytics.didactic.standard")
                    : t("calculus.analytics.didactic.projection")}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Asymptotes (VWO B/D) */}
        <div className="space-y-2 p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-medium">
              {t("calculus.analytics.didactic.asymptotes")}
            </span>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  showAsymptotes: !prev.showAsymptotes,
                }))
              }
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all border ${
                state.showAsymptotes
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                  : "bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {state.showAsymptotes ? "Aan" : "Uit"}
            </button>
          </div>
          {state.showAsymptotes && (
            <p className="text-[9px] text-rose-400/60 italic">
              {t("calculus.analytics.didactic.asymptotes_desc")}
            </p>
          )}
        </div>

        {/* Secant Line (Differentiequotiënt) */}
        <div className="space-y-2 p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-medium">
              {t("calculus.analytics.didactic.secant")}
            </span>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  showSecantLine: !prev.showSecantLine,
                }))
              }
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all border ${
                state.showSecantLine
                  ? "bg-teal-500/10 text-teal-400 border-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.2)]"
                  : "bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {state.showSecantLine ? "Aan" : "Uit"}
            </button>
          </div>
          {state.showSecantLine && (
            <p className="text-[9px] text-teal-400/60 italic">
              {t("calculus.analytics.didactic.secant_desc")}
            </p>
          )}
        </div>

        {/* Derivative Graph (V2.1) */}
        <div className="space-y-2 p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-medium">
              {t("calculus.analytics.didactic.derivative_graph")}
            </span>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  showDerivativeGraph: !prev.showDerivativeGraph,
                }))
              }
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all border ${
                state.showDerivativeGraph
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                  : "bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {state.showDerivativeGraph ? "Aan" : "Uit"}
            </button>
          </div>
          {state.showDerivativeGraph && (
            <p className="text-[9px] text-orange-400/60 italic">
              Toont f'(x) als stippellijn met helling-kleuren
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
