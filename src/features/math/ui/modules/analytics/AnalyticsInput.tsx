/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Analytics Input Component
 *
 * Function input section with plot mode selector (cartesian/parametric/polar)
 * and function input fields.
 */

import { StepSolver } from "@features/math/api/StepSolver";
import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
// nerdamer import removed for lazy loading
import type { AnalyticsModuleState } from "@features/math/types";
import { SolutionSteps } from "@features/math/ui/SolutionSteps";
import { useTranslations } from "@shared/hooks/useTranslations";
import { BrainCircuit, Play, Plus, Sigma, Trash2 } from "lucide-react";
import * as math from "mathjs";
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
    console.error("AnalyticsInput: Failed to load nerdamer", e);
    return null;
  }
}

export const AnalyticsInput: React.FC = () => {
  const { t } = useTranslations();
  const {
    rawFunctions,
    setRawFunctions,
    processedFunctions,
    solutionResult,
    setSolutionResult,
    integralState,
    setIntegralState,
  } = useMathLabContext();

  const [state, setState] = useModuleState<AnalyticsModuleState>("analytics");

  const handleSolve = async (expr: string) => {
    const type = expr.includes("=") ? "roots" : "derivative";
    let variable = "x";
    if (state.plotMode === "parametric") variable = "t";
    else if (state.plotMode === "polar") variable = "theta";
    const result = await StepSolver.solve(expr, type, variable, t);
    setSolutionResult(result);
  };

  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const recognitionRef = React.useRef<any>(null);

  // Voice-to-math transcription
  const transcribeToMath = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/\bsine\b|\bsin\b/g, "sin")
      .replace(/\bcosine\b|\bcos\b/g, "cos")
      .replace(/\btangent\b|\btan\b/g, "tan")
      .replace(/\bsquare root of\b|\bsquare root\b|\bwortel\b/g, "sqrt")
      .replace(/\bsquared\b|\bkwadraat\b/g, "^2")
      .replace(/\bcubed\b|\bderde macht\b/g, "^3")
      .replace(/\bto the power of\b|\btot de macht\b/g, "^")
      .replace(/\bpi\b/g, "pi")
      .replace(/\bexponent\b|\be to the\b|\be\^/g, "exp(")
      .replace(/\bnatural log\b|\bln\b/g, "ln")
      .replace(/\bplus\b/g, "+")
      .replace(/\bminus\b|\bmin\b/g, "-")
      .replace(/\btimes\b|\bmaal\b|\bkeer\b/g, "*")
      .replace(/\bdivided by\b|\bgedeeld door\b/g, "/")
      .replace(/\bopen\b|\bopening\b/g, "(")
      .replace(/\bclose\b|\bsluiten\b/g, ")")
      .replace(/\bx\b/g, "x")
      .replace(/\bover\b/g, "/")
      .replace(/\s+/g, "");
  };

  const startListening = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(t("calculus.analytics.voice.unsupported"));
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "nl-NL";

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);

    recognitionRef.current.onresult = (event: any) => {
      const current = event.results[event.results.length - 1];
      const spoken = current[0].transcript;
      setTranscript(spoken);

      if (current.isFinal) {
        const mathExpr = transcribeToMath(spoken);
        const newFns = [...rawFunctions];
        if (newFns[0]) {
          newFns[0] = mathExpr;
        } else {
          newFns.push(mathExpr);
        }
        setRawFunctions(newFns);
        setTranscript("");
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Voice Input (V2.1 Wow Factor) */}
      <div className="relative p-4 bg-gradient-to-br from-fuchsia-900/30 to-violet-900/30 border border-fuchsia-500/30 rounded-xl overflow-hidden">
        {isListening && (
          <div className="absolute inset-0 bg-fuchsia-500/10 animate-pulse" />
        )}
        <div className="relative flex items-center gap-3">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`p-3 rounded-full transition-all ${
              isListening
                ? "bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse"
                : "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 hover:bg-fuchsia-500/30 hover:shadow-[0_0_20px_rgba(192,132,252,0.3)]"
            }`}
          >
            {isListening ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <div className="text-[10px] text-fuchsia-400 uppercase tracking-wider font-bold mb-1">
              {isListening
                ? t("calculus.analytics.voice.listening")
                : t("calculus.analytics.voice.speak")}
            </div>
            {transcript ? (
              <div className="text-sm text-white/80 italic">"{transcript}"</div>
            ) : (
              <div className="text-[10px] text-fuchsia-400/50">
                {t("calculus.analytics.voice.hint")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plot Mode Selector */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        {(["cartesian", "parametric", "polar"] as const).map((mode) => {
          const activeColor =
            mode === "cartesian"
              ? "bg-cyan-400 text-black shadow-lg shadow-cyan-500/20"
              : mode === "parametric"
                ? "bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                : "bg-fuchsia-400 text-black shadow-lg shadow-fuchsia-500/20";
          return (
            <button
              key={mode}
              onClick={() => setState((s: any) => ({ ...s, plotMode: mode }))}
              className={`flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                state.plotMode === mode
                  ? activeColor
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {mode === "cartesian"
                ? "y = f(x)"
                : mode === "parametric"
                  ? "x(t), y(t)"
                  : "r(θ)"}
            </button>
          );
        })}
      </div>

      {/* Cartesian Mode */}
      {state.plotMode === "cartesian" && (
        <div className="space-y-3">
          {rawFunctions.map((fn, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex gap-2 items-center mb-2">
                <span
                  className="font-bold text-xs font-mono shrink-0 w-8 text-right"
                  style={{
                    color: [
                      "#00D1FF",
                      "#F055BA",
                      "#00FF9D",
                      "#FFD166",
                      "#A06CD5",
                    ][idx % 5],
                  }}
                >
                  y{idx + 1}=
                </span>
                <div className="relative group flex-1">
                  <input
                    value={fn}
                    onChange={(e) => {
                      const newFns = [...rawFunctions];
                      newFns[idx] = e.target.value;
                      setRawFunctions(newFns);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-electric transition-all pr-12"
                    placeholder="f(x) = ..."
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {fn && (
                      <button
                        onClick={() => handleSolve(fn)}
                        className="p-1.5 text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded-md transition-all"
                        title="Show Step-by-Step Solution"
                      >
                        <BrainCircuit size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const newFns = rawFunctions.filter((_, i) => i !== idx);
                        setRawFunctions(newFns);
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-md transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Integral UI (First function only) */}
              {idx === 0 && (
                <div className="ml-10 p-2 bg-white/5 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() =>
                        setIntegralState((s) => ({ ...s, show: !s.show }))
                      }
                      className={`px-2 py-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${integralState.show ? "bg-amber-500 text-black" : "hover:bg-white/10 text-slate-400"}`}
                    >
                      <Sigma size={12} /> {t("calculus.integral_area")}
                    </button>
                    {integralState.show && integralState.result && (
                      <span className="text-amber-400 font-mono text-xs shadow-[0_0_10px_rgba(251,191,36,0.2)] px-2 py-0.5 rounded bg-black/40">
                        Ans: {integralState.result}
                      </span>
                    )}
                  </div>

                  {integralState.show && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/10">
                        <span className="text-[10px] text-slate-500">
                          {t("calculus.integral_from")}
                        </span>
                        <input
                          type="number"
                          value={integralState.from}
                          onChange={(e) =>
                            setIntegralState((s) => ({
                              ...s,
                              from: Number(e.target.value),
                            }))
                          }
                          className="w-12 bg-transparent text-xs text-white outline-none text-center font-mono"
                          step="0.1"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/10">
                        <span className="text-[10px] text-slate-500">
                          {t("calculus.integral_to")}
                        </span>
                        <input
                          type="number"
                          value={integralState.to}
                          onChange={(e) =>
                            setIntegralState((s) => ({
                              ...s,
                              to: Number(e.target.value),
                            }))
                          }
                          className="w-12 bg-transparent text-xs text-white outline-none text-center font-mono"
                          step="0.1"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const n = await initNerdamer();
                            if (!n) {
                              setIntegralState((s) => ({
                                ...s,
                                result: "Laden...",
                              }));
                              return;
                            }
                            const val = n(
                              `defint(${processedFunctions[0]}, ${integralState.from}, ${integralState.to})`,
                            ).text();
                            let num;
                            try {
                              num = math.evaluate(val);
                            } catch {
                              num = null;
                            }
                            setIntegralState((s) => ({
                              ...s,
                              result:
                                typeof num === "number" ? num.toFixed(4) : val,
                            }));
                          } catch {
                            setIntegralState((s) => ({
                              ...s,
                              result: "Error",
                            }));
                          }
                        }}
                        className="ml-auto p-1.5 bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black rounded transition-all"
                        title={t("calculus.calc_area")}
                      >
                        <Play size={10} fill="currentColor" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => setRawFunctions([...rawFunctions, ""])}
            className="w-full py-2 border border-dashed border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            {t("calculus.analytics.add_function")}
          </button>
        </div>
      )}

      {/* Parametric Mode */}
      {state.plotMode === "parametric" && (
        <div className="space-y-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Parametric Equations
          </div>
          {Array.from({
            length: Math.ceil(Math.max(rawFunctions.length, 2) / 2),
          }).map((_, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-[10px] text-cyan-400 uppercase">
                    x(t)
                  </label>
                  <span
                    className="text-[9px] font-mono font-bold"
                    style={{
                      color: [
                        "#00D1FF",
                        "#F055BA",
                        "#00FF9D",
                        "#FFD166",
                        "#A06CD5",
                      ][i % 5],
                    }}
                  >
                    Curve {i + 1}
                  </span>
                </div>
                <input
                  value={rawFunctions[i * 2] || ""}
                  onChange={(e) => {
                    const newFns = [...rawFunctions];
                    while (newFns.length <= i * 2 + 1) newFns.push("");
                    newFns[i * 2] = e.target.value;
                    setRawFunctions(newFns);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-electric transition-all"
                  placeholder="cos(t)"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-pink-400 uppercase mb-1 block">
                  y(t)
                </label>
                <input
                  value={rawFunctions[i * 2 + 1] || ""}
                  onChange={(e) => {
                    const newFns = [...rawFunctions];
                    while (newFns.length <= i * 2 + 1) newFns.push("");
                    newFns[i * 2 + 1] = e.target.value;
                    setRawFunctions(newFns);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-electric transition-all"
                  placeholder="sin(t)"
                />
              </div>
              <button
                onClick={() => {
                  const newFns = rawFunctions.filter(
                    (_, idx) => idx !== i * 2 && idx !== i * 2 + 1,
                  );
                  setRawFunctions(newFns);
                }}
                className="p-2 text-slate-500 hover:text-red-400 rounded-md transition-all self-end mb-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setRawFunctions([...rawFunctions, "", ""])}
            className="w-full py-2 border border-dashed border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            {t("calculus.analytics.add_parametric")}
          </button>
          <div className="text-[9px] text-slate-600 italic">
            t ranges from 0 to 2π
          </div>
        </div>
      )}

      {/* Polar Mode */}
      {state.plotMode === "polar" && (
        <div className="space-y-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Polar Equations
          </div>
          {Array.from({ length: Math.max(rawFunctions.length, 1) }).map(
            (_, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <span
                  className="font-bold shrink-0 w-8"
                  style={{
                    color: [
                      "#00D1FF",
                      "#F055BA",
                      "#00FF9D",
                      "#FFD166",
                      "#A06CD5",
                    ][i % 5],
                  }}
                >
                  r{i + 1}(θ)=
                </span>
                <div className="flex-1 relative">
                  <input
                    value={rawFunctions[i] || ""}
                    onChange={(e) => {
                      const newFns = [...rawFunctions];
                      while (newFns.length <= i) newFns.push("");
                      newFns[i] = e.target.value;
                      setRawFunctions(newFns);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-electric transition-all pr-10"
                    placeholder="1 + cos(theta)"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <button
                      onClick={() =>
                        handleSolve(rawFunctions[i] || "1 + cos(theta)")
                      }
                      className="p-1.5 text-fuchsia-400 hover:text-white hover:bg-fuchsia-500/20 rounded-md transition-all"
                    >
                      <BrainCircuit size={14} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newFns = rawFunctions.filter((_, idx) => idx !== i);
                    setRawFunctions(newFns);
                  }}
                  className="p-2 text-slate-500 hover:text-red-400 rounded-md transition-all shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          )}
          <button
            onClick={() => setRawFunctions([...rawFunctions, ""])}
            className="w-full py-2 border border-dashed border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            {t("calculus.analytics.add_polar")}
          </button>
          <div className="text-[9px] text-slate-600 italic">
            {t("calculus.analytics.theta_range")}
          </div>
        </div>
      )}

      {/* Step-by-Step Solution */}
      {solutionResult && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                state.plotMode === "cartesian"
                  ? "text-cyan-400"
                  : state.plotMode === "parametric"
                    ? "text-amber-400"
                    : "text-fuchsia-400"
              }`}
            >
              <BrainCircuit size={14} />
              Step-by-Step Solution
            </span>
            <button
              onClick={() => setSolutionResult(null)}
              className="text-[10px] text-slate-500 hover:text-white uppercase tracking-wider font-bold"
            >
              Close Steps
            </button>
          </div>
          <SolutionSteps solution={solutionResult} />
        </div>
      )}
    </div>
  );
};
