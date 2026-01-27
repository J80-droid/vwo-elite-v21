import { useTranslations } from "@shared/hooks/useTranslations";
import {
  Activity,
  ArrowLeftRight,
  FlaskConical,
  Grid,
  Layers,
  RotateCcw,
  Sun,
  Zap,
} from "lucide-react";
import React from "react";

import { OpticsState, useOpticsEngine } from "./useOpticsEngine";

export const OpticsSidebar: React.FC = () => {
  const { state, derived, setParam, reset } = useOpticsEngine();
  const { t } = useTranslations();

  // Mapping derived values for compatibility
  // In Single mode, we use v1/m1. In System mode, we primarily show v2/mTotal?
  // Let's show primary image stats.
  const v = state.scenario === "system" ? derived.v2 : derived.v1;
  const m = state.scenario === "system" ? derived.mTotal : derived.m1;
  const S = derived.S; // Always S1? Or S_total? Typically S of lens 1.
  // Let's keep S as S1 for now.

  const isVirtual =
    state.scenario === "system" ? derived.isVirtual2 : derived.isVirtual;
  const hasImage =
    state.scenario === "system" ? derived.hasImage2 : derived.hasImage1;

  // Visuele grens voor "oneindig" in de UI
  const isInfinity = !hasImage || Math.abs(v || 0) > 9999;

  const toggleLensType = () => {
    setParam("lensType", state.lensType === "convex" ? "concave" : "convex");
  };

  const toggleMode = () => {
    setParam("mode", state.mode === "simple" ? "lensmaker" : "simple");
  };

  const toggleScenario = () => {
    const scenarios: OpticsState["scenario"][] = [
      "single",
      "system",
      "eye",
      "correction",
    ];
    const currentIdx = scenarios.indexOf(state.scenario);
    const next = scenarios[(currentIdx + 1) % scenarios.length]!;
    setParam("scenario", next);
  };

  const toggleLens2Type = () => {
    setParam("lens2Type", state.lens2Type === "convex" ? "concave" : "convex");
  };

  // Labels en ranges variëren per mode
  const getScenarioLabel = () => {
    switch (state.scenario) {
      case "single":
        return "Single 1x";
      case "system":
        return "System 2x";
      case "eye":
        return "Oog Model";
      case "correction":
        return "Bril + Oog";
    }
  };

  return (
    <div className="flex flex-row items-center gap-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* 1. Visual Options Group */}
      <div className="flex items-center gap-2 pr-4 border-r border-white/10">
        <button
          onClick={() => setParam("showValues", !state.showValues)}
          className={`btn-elite-neon ${state.showValues ? "active" : ""} !p-2`}
          title="Toon Waarden"
        >
          <Activity size={18} />
        </button>
        <button
          onClick={() => setParam("showRays", !state.showRays)}
          className={`btn-elite-neon btn-elite-neon-amber ${state.showRays ? "active" : ""} !p-2`}
          title="Toon Lichtstralen"
        >
          <Sun size={18} />
        </button>
        <button
          onClick={() => setParam("showLasers", !state.showLasers)}
          className={`btn-elite-neon btn-elite-neon-rose ${state.showLasers ? "active" : ""} !p-2`}
          title="Laser Modus"
        >
          <Zap size={18} />
        </button>
        <button
          onClick={() => setParam("showDispersion", !state.showDispersion)}
          className={`btn-elite-neon btn-elite-neon-purple ${state.showDispersion ? "active" : ""} !p-2`}
          title="Dispersie (Kleurshifting)"
        >
          <span className="font-bold text-[10px] text-purple-300">RGB</span>
        </button>

        <button
          onClick={() => setParam("showGraph", !state.showGraph)}
          className={`btn-elite-neon ${state.showGraph ? "active btn-elite-neon-cyan" : "btn-elite-neon-slate"} !p-2`}
          title="Grafieken (u,v)"
        >
          <span className="font-bold text-[10px]">GRAFIEK</span>
        </button>
        <button
          onClick={() => setParam("showGrid", !state.showGrid)}
          className={`btn-elite-neon btn-elite-neon-blue ${state.showGrid ? "active" : ""} !p-2`}
          title="Toon Raster"
        >
          <Grid size={18} />
        </button>
      </div>

      {/* 2. Scenario & Lens Mode */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleScenario}
          className={`btn-elite-neon !px-3 flex items-center gap-2 ${state.scenario !== "single" ? "active btn-elite-neon-cyan" : "btn-elite-neon-slate"}`}
          title="Wissel Scenario: Single -> System -> Eye -> Correction"
        >
          <Layers size={14} />
          <span className="text-[10px] font-bold uppercase w-20 text-center">
            {getScenarioLabel()}
          </span>
        </button>

        {/* Lens Type only relevant for Single/System */}
        {state.scenario === "single" && (
          <button
            onClick={toggleLensType}
            className="btn-elite-neon btn-elite-neon-cyan !px-3 flex items-center gap-2"
            title="Wissel Lenstype"
          >
            <ArrowLeftRight size={14} />
            <span className="text-[10px] font-bold uppercase w-16 text-center">
              {state.lensType === "convex" ? "Bol (Pos)" : "Hol (Neg)"}
            </span>
          </button>
        )}

        <button
          onClick={toggleMode}
          className={`btn-elite-neon !px-3 flex items-center gap-2 ${state.mode === "lensmaker" ? "active btn-elite-neon-purple" : "btn-elite-neon-slate"}`}
          title="Lensmaker Modus"
          disabled={state.scenario === "eye" || state.scenario === "correction"} // Disable Lab Mode for Eye
        >
          <FlaskConical size={14} />
          <span className="text-[10px] font-bold uppercase">
            {state.mode === "lensmaker" ? "Lab Mode" : "Simple"}
          </span>
        </button>
      </div>

      {/* 3. Main Parameters Sliders */}
      <div className="flex items-center gap-4 border-l border-white/10 pl-4">
        {/* DYNAMISCHE CONTROLS PER SCENARIO */}

        {/* EYE & CORRECTION: Sliders anders */}
        {state.scenario === "eye" || state.scenario === "correction" ? (
          <>
            {/* Control 1: Accommodatie OF Bril */}
            <div className="flex flex-col gap-1 w-28">
              <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                <span>
                  {state.scenario === "correction" ? "Bril (S)" : "Ooglens (f)"}
                </span>
                <span className="text-white">
                  {state.scenario === "correction"
                    ? `${(state.glassesDiopters || 0).toFixed(2)} dpt`
                    : `${state.focalLength} mm`}
                </span>
              </label>
              <input
                type="range"
                min={state.scenario === "correction" ? "-10" : "30"}
                max={state.scenario === "correction" ? "10" : "80"}
                step={state.scenario === "correction" ? "0.25" : "1"}
                value={
                  state.scenario === "correction"
                    ? state.glassesDiopters || 0
                    : state.focalLength
                }
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (state.scenario === "correction") {
                    setParam("glassesDiopters", val);
                  } else {
                    setParam("focalLength", val);
                  }
                }}
                className={`w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer ${state.scenario === "correction" ? "accent-cyan-400" : "accent-rose-500"}`}
              />
            </div>

            {/* Control 2: Accommodatie (alleen Correction) */}
            {state.scenario === "correction" && (
              <div className="flex flex-col gap-1 w-28 border-l border-white/10 pl-4">
                <label className="text-[10px] uppercase font-bold text-rose-400 flex justify-between">
                  <span>Ooglens (Accom.)</span>
                  <span className="text-white">
                    {state.eyeAccommodation || 50} mm
                  </span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="80"
                  step="1"
                  value={state.eyeAccommodation || 50}
                  onChange={(e) =>
                    setParam("eyeAccommodation", Number(e.target.value))
                  }
                  className="w-full accent-rose-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Control 3: Voorwerp (Common) */}
            <div className="flex flex-col gap-1 w-28 pl-4 border-l border-white/10">
              <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                <span>Afstand (u)</span>
                <span className="text-white">{state.objectDistance} mm</span>
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="10"
                value={state.objectDistance}
                onChange={(e) =>
                  setParam("objectDistance", Number(e.target.value))
                }
                className="w-full accent-amber-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>
            {/* Clinical Presets (Doctor Simulator) */}
            <div className="flex flex-col gap-1 pl-4 border-l border-white/10">
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                Diagnose
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setParam("eyeLength", 50);
                    setParam("eyeAccommodation", 50);
                  }}
                  className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold"
                  title="Normaal Model"
                >
                  NORM
                </button>
                <button
                  onClick={() => {
                    setParam("eyeLength", 52);
                    setParam("eyeAccommodation", 50);
                  }}
                  className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-bold"
                  title="Bijziend (Myopie)"
                >
                  MYOP
                </button>
                <button
                  onClick={() => {
                    setParam("eyeLength", 48);
                    setParam("eyeAccommodation", 50);
                  }}
                  className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[9px] font-bold"
                  title="Verziend (Hypermetropie)"
                >
                  HYPER
                </button>
              </div>
            </div>

            {/* Clinical Findings HUD */}
            {(state.scenario === "eye" || state.scenario === "correction") && (
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/10 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-white/5 pb-1 mb-1">
                  Klinische Bevindingen
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">
                      Visus
                    </span>
                    <span
                      className={`text-lg font-black italic ${derived.visus === 1 ? "text-emerald-400" : "text-amber-400"}`}
                    >
                      {(derived.visus || 1.0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">
                      Sterkte-fout
                    </span>
                    <span
                      className={`text-lg font-black italic ${(derived.refractionErrorDpt || 0) === 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {(derived.refractionErrorDpt || 0) > 0 ? "+" : ""}
                      {(derived.refractionErrorDpt || 0).toFixed(2)}{" "}
                      <span className="text-[9px] not-italic opacity-50">
                        dpt
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Diagnose
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-lg ${
                      derived.eyeStatus === "Normal"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : derived.eyeStatus === "Myopia"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    }`}
                  >
                    {derived.eyeStatus === "Normal"
                      ? "Emmetropie"
                      : derived.eyeStatus === "Myopia"
                        ? "Myopie"
                        : "Hypermetropie"}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* NORMAL / SYSTEM MODES (Existing Logic) */
          <>
            {state.mode === "simple" ? (
              <div className="flex flex-col gap-1 w-24">
                <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                  <span>Focus 1</span>
                  <span className="text-white">{state.focalLength} mm</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="1"
                  value={state.focalLength}
                  onChange={(e) =>
                    setParam("focalLength", Number(e.target.value))
                  }
                  className="w-full accent-rose-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
            ) : (
              /* LENSMAKER MODE (Lens 1 only currently) */
              <>
                <div className="flex flex-col gap-1 w-24">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                    <span>Straal R</span>
                    <span className="text-purple-400">
                      {state.curvatureRadius}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={state.curvatureRadius}
                    onChange={(e) =>
                      setParam("curvatureRadius", Number(e.target.value))
                    }
                    className="w-full accent-purple-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1 w-24">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                    <span>Index n</span>
                    <span className="text-purple-400">
                      {state.refractiveIndex.toFixed(2)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1.1"
                    max="2.5"
                    step="0.01"
                    value={state.refractiveIndex}
                    onChange={(e) =>
                      setParam("refractiveIndex", Number(e.target.value))
                    }
                    className="w-full accent-purple-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-1">
                    <button
                      onClick={() => setParam("refractiveIndex", 1.33)}
                      className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded border border-blue-500/30"
                      title="Water (n=1.33)"
                    >
                      💧
                    </button>
                    <button
                      onClick={() => setParam("refractiveIndex", 1.5)}
                      className="text-[10px] px-1.5 py-0.5 bg-slate-500/20 hover:bg-slate-500/40 text-slate-300 rounded border border-slate-500/30"
                      title="Glas (n=1.50)"
                    >
                      🪟
                    </button>
                    <button
                      onClick={() => setParam("refractiveIndex", 2.42)}
                      className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded border border-cyan-500/30"
                      title="Diamant (n=2.42)"
                    >
                      💎
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* LENS 2 CONTROLS (System Mode) */}
            {state.scenario === "system" && (
              <div className="flex flex-col gap-1 w-24 border-l border-white/10 pl-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase font-bold text-cyan-400">
                    Focus 2
                  </label>
                  <button
                    onClick={toggleLens2Type}
                    className="text-[9px] px-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded"
                  >
                    {state.lens2Type === "convex" ? "BOL" : "HOL"}
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-white/50 mb-1">
                  <span>{state.lens2FocalLength} mm</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={state.lens2FocalLength}
                  onChange={(e) =>
                    setParam("lens2FocalLength", Number(e.target.value))
                  }
                  className="w-full accent-cyan-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
                <label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between mt-1">
                  <span>Afstand d</span>
                  <span className="text-white">{state.lens2Distance} mm</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="600"
                  step="10"
                  value={state.lens2Distance}
                  onChange={(e) =>
                    setParam("lens2Distance", Number(e.target.value))
                  }
                  className="w-full accent-slate-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Object Distance Slider (Common for Single/System) */}
            <div className="flex flex-col gap-1 w-24 pl-4 border-l border-white/10">
              <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                <span>Voorwerp u</span>
                <span className="text-white">{state.objectDistance} mm</span>
              </label>
              <input
                type="range"
                min="50"
                max="600"
                step="1"
                value={state.objectDistance}
                onChange={(e) =>
                  setParam("objectDistance", Number(e.target.value))
                }
                className="w-full accent-amber-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </>
        )}
      </div>

      {/* 4. Readout HUD (Glass Card) */}
      <div className="flex items-center gap-6 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden ml-4">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none" />

        {/* Beeld (v) - Shows vFinal */}
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
            Beeld (v)
          </span>
          <span
            className={`text-sm font-mono font-bold ${isVirtual ? "text-pink-400" : "text-sky-400"}`}
          >
            {isInfinity ? "∞" : Math.round(v || 0)}
            <span className="text-[10px] text-slate-500 ml-1">mm</span>
          </span>
        </div>

        {/* Magnification M - Shows mTotal */}
        <div className="flex flex-col border-l border-white/10 pl-4">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
            Factor (N)
          </span>
          <span className="text-sm font-mono font-bold text-white">
            {isInfinity ? "-" : Math.abs(m || 0).toFixed(2)}x
          </span>
        </div>

        {/* Diopters S - Only Lens 1 for now */}
        <div className="flex flex-col border-l border-white/10 pl-4">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
            Sterkte (S1)
          </span>
          <span
            className={`text-sm font-mono font-bold ${S > 0 ? "text-emerald-400" : "text-rose-400"}`}
          >
            {S > 0 ? "+" : ""}
            {S.toFixed(2)}
            <span className="text-[10px] text-slate-500 ml-1">dpt</span>
          </span>
        </div>
      </div>

      <div className="w-px h-8 bg-white/10 mx-2" />

      {/* 5. Reset Button */}
      <button
        onClick={reset}
        className="btn-elite-neon btn-elite-neon-slate !p-2"
        title={t("physics.spring.reset")}
      >
        <RotateCcw size={18} />
      </button>
    </div>
  );
};
