import {
  Activity,
  Flame,
  Gauge,
  Layers,
  Play,
  RefreshCcw,
  Square,
  Wind,
} from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  ThermodynamicsState,
  useThermodynamicsEngine,
} from "./useThermodynamicsEngine";

// 1. ANALYSIS HUD (Top Left)
export const AnalysisHUD: React.FC = () => {
  const { state, history, clearHistory } = useThermodynamicsEngine();
  const { t } = useTranslation("physics");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const hist = history.current;
      if (hist.length < 2) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dynamic Scaling
      const vs = hist.map((d) => d.V);
      const ps = hist.map((d) => d.P);

      let vMin = Math.min(...vs);
      let vMax = Math.max(...vs);
      const pMin = 0;
      let pMax = Math.max(...ps);

      // Add padding
      const vRange = Math.max(0.1, vMax - vMin);
      vMin = Math.max(0.1, vMin - vRange * 0.1);
      vMax = vMax + vRange * 0.1;
      pMax = pMax * 1.2 || 100;

      if (vMax === vMin) {
        vMin -= 0.1;
        vMax += 0.1;
      }

      // Draw Grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        const gx = (i / 6) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvas.height);
        ctx.stroke();
        const gy = (i / 6) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(canvas.width, gy);
        ctx.stroke();
      }

      // Draw Theoretical Isotherm (Reference)
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(14, 165, 233, 0.4)"; // Sky blue glow for theory
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const currentP = hist[hist.length - 1]!.P;
      const currentV = hist[hist.length - 1]!.V;
      const Constant = currentP * currentV;

      for (let v = vMin; v <= vMax; v += (vMax - vMin) / 100) {
        const p = Constant / v;
        const x = ((v - vMin) / (vMax - vMin)) * canvas.width;
        const y = canvas.height - ((p - pMin) / (pMax - pMin)) * canvas.height;
        if (v === vMin) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Curve with Temperature Color
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;

      for (let i = 0; i < hist.length - 1; i++) {
        const d1 = hist[i]!;
        const d2 = hist[i + 1]!;

        const x1 = ((d1.V - vMin) / (vMax - vMin)) * canvas.width;
        const y1 =
          canvas.height - ((d1.P - pMin) / (pMax - pMin)) * canvas.height;
        const x2 = ((d2.V - vMin) / (vMax - vMin)) * canvas.width;
        const y2 =
          canvas.height - ((d2.P - pMin) / (pMax - pMin)) * canvas.height;

        const hue = Math.max(0, Math.min(240, 240 - (d1.T - 200) * 0.4));
        ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Axis Labels
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px Geist Mono";
      ctx.fillText("P (kPa)", 15, canvas.height - 15);
      ctx.fillText("V (L)", canvas.width - 45, canvas.height - 15);
    };

    const interval = setInterval(draw, 100);
    return () => clearInterval(interval);
  }, [history]);

  return (
    <div className="flex flex-col gap-2">
      {/* Unified Analysis Station - Narrower Width */}
      <div className="w-[320px] bg-[#020617]/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Header with Readouts - More Compact Layout */}
        <div className="px-5 py-4 border-b border-white/5 bg-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={10} className="text-rose-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                {t("thermodynamics.pv_diagram")}
              </span>
            </div>
            <button
              onClick={clearHistory}
              className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all shadow-lg"
              title="Grafiek wissen"
            >
              <RefreshCcw size={12} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col">
              <span className="text-[6px] font-black uppercase tracking-[0.1em] text-slate-500 mb-0.5">
                P (kPa)
              </span>
              <div className="text-sm font-black text-rose-500 tabular-nums">
                {state.P.toFixed(1)}
              </div>
            </div>
            <div className="flex flex-col border-l border-white/5 pl-2">
              <span className="text-[6px] font-black uppercase tracking-[0.1em] text-slate-500 mb-0.5">
                V (L)
              </span>
              <div className="text-sm font-black text-sky-400 tabular-nums">
                {state.V.toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col border-l border-white/5 pl-2">
              <span className="text-[6px] font-black uppercase tracking-[0.1em] text-slate-500 mb-0.5">
                T (K)
              </span>
              <div className="text-sm font-black text-amber-500 tabular-nums">
                {state.T.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Main Graph Area */}
        <div className="relative h-[200px]">
          <canvas
            ref={canvasRef}
            width={320}
            height={200}
            className="w-full h-full opacity-90"
          />

          {/* Scanning Line Effect Overlay */}
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.04] to-transparent h-[4px] animate-scan"
            style={{ top: "0%" }}
          />
        </div>
      </div>
    </div>
  );
};

// 2. PARAMETERS HUD (Top Right)
export const ParametersHUD: React.FC = () => {
  const { state } = useThermodynamicsEngine();
  const { t } = useTranslation("physics");

  return (
    <div className="flex flex-col gap-3 p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Gauge size={14} className="text-rose-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {t("layout.parameters")}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold text-slate-500 uppercase">Proces</span>
          <span
            className={`font-mono transition-colors uppercase ${state.processMode === "adiabatic" ? "text-sky-400" : "text-orange-400"}`}
          >
            {state.processMode === "adiabatic" ? "Adiabaat" : "Isotherm"}
          </span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold text-slate-500 uppercase">Scenario</span>
          <span className="font-mono text-white uppercase">
            {state.simMode.replace("_", " ")}
          </span>
        </div>
        {state.simMode === "hydrogen" && (
          <div className="flex justify-between items-center text-[10px] animate-in fade-in slide-in-from-top duration-300">
            <span className="font-bold text-slate-500 uppercase">
              Molaire Massa (H₂)
            </span>
            <span className="font-mono text-emerald-400">
              2.016 <span className="text-slate-600 italic">g/mol</span>
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold text-slate-500 uppercase">
            {t("thermodynamics.particles")}
          </span>
          <span className="font-mono text-emerald-400">
            {state.n} <span className="text-slate-600 italic">pts</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// 3. SIDEBAR CONTROLS (Immersive Bar)
export const ThermoSidebar: React.FC = () => {
  const { state, setParam, reset } = useThermodynamicsEngine();
  const { t } = useTranslation("physics");

  return (
    <div className="flex flex-row items-center gap-8 px-2">
      {/* 1. CONFIGURATION BLOCK (Modes) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {[
            { id: "ideal_gas", label: "Ideaal", icon: Gauge },
            { id: "hydrogen", label: "H2", icon: Activity },
            { id: "wind_turbine", label: "Wind", icon: Wind },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() =>
                setParam("simMode", mode.id as ThermodynamicsState["simMode"])
              }
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${state.simMode === mode.id ? "bg-white/10 text-white shadow-glow" : "text-slate-500 hover:text-slate-300"}`}
            >
              <mode.icon
                size={10}
                className={
                  state.simMode === mode.id ? "text-rose-400" : "text-slate-600"
                }
              />
              {mode.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setParam("processMode", "isothermal")}
            className={`flex-1 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${state.processMode === "isothermal" ? "bg-orange-500/20 text-orange-400 border border-orange-500/10" : "text-slate-500 hover:text-slate-300"}`}
          >
            Isotherm
          </button>
          <button
            onClick={() => setParam("processMode", "adiabatic")}
            className={`flex-1 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${state.processMode === "adiabatic" ? "bg-sky-500/20 text-sky-400 border border-sky-500/10" : "text-slate-500 hover:text-slate-300"}`}
          >
            Adiabaat
          </button>
        </div>
      </div>

      <div className="w-[1px] h-12 bg-white/5" />

      {/* 2. PARAMETERS BLOCK (Sliders) */}
      <div className="flex flex-col gap-3">
        {/* Temperature Row */}
        <div className="flex items-center gap-3 bg-white/5 p-1.5 pl-3 rounded-xl border border-white/5">
          <Flame size={14} className="text-orange-400 opacity-60" />
          <div className="flex flex-col w-32">
            <div className="flex justify-between text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">
              <span>Bron (Tₑ)</span>
              <span className="text-orange-400">
                {state.targetT.toFixed(0)}K
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="10"
              value={state.targetT}
              onChange={(e) => setParam("targetT", Number(e.target.value))}
              className="w-full h-1 bg-white/5 rounded-full appearance-none accent-orange-500 cursor-pointer"
            />
          </div>
        </div>
        {/* Volume Row */}
        <div
          className={`flex items-center gap-3 bg-white/5 p-1.5 pl-3 rounded-xl border border-white/5 transition-opacity duration-300 ${state.simMode === "wind_turbine" ? "opacity-30 pointer-events-none cursor-not-allowed" : ""}`}
        >
          <Wind size={14} className="text-sky-400 opacity-60" />
          <div className="flex flex-col w-32">
            <div className="flex justify-between text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">
              <span>
                {state.simMode === "wind_turbine"
                  ? "FIXED (V)"
                  : t("thermodynamics.volume")}
              </span>
              <span className="text-sky-400">{state.targetV.toFixed(2)}L</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              value={state.targetV}
              onChange={(e) => setParam("targetV", Number(e.target.value))}
              disabled={state.simMode === "wind_turbine"}
              className="w-full h-1 bg-white/5 rounded-full appearance-none accent-sky-500 cursor-pointer disabled:accent-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="w-[1px] h-12 bg-white/5" />

      {/* 3. EXECUTION BLOCK (Actions & Toggles) */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setParam("isPlaying", !state.isPlaying)}
            className={`btn-elite-neon !py-1 !px-4 flex-1 justify-center transition-all duration-300 ${state.isPlaying ? "btn-elite-neon-rose active animate-pulse" : "btn-elite-neon-emerald"}`}
          >
            {state.isPlaying ? (
              <Square size={12} fill="currentColor" />
            ) : (
              <Play size={12} fill="currentColor" />
            )}
          </button>
          <button
            onClick={reset}
            className="btn-elite-neon btn-elite-neon-blue !p-1.5 flex-1 justify-center"
          >
            <RefreshCcw size={12} />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setParam("showParticles", !state.showParticles)}
            className={`flex-1 flex justify-center p-1.5 rounded-lg border transition-all ${state.showParticles ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/5 text-slate-500"}`}
            title={t("thermodynamics.particles")}
          >
            <Activity size={12} />
          </button>
          <button
            onClick={() => setParam("showGasGlow", !state.showGasGlow)}
            className={`flex-1 flex justify-center p-1.5 rounded-lg border transition-all ${state.showGasGlow ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-white/5 border-white/5 text-slate-500"}`}
            title={t("thermodynamics.heat")}
          >
            <Layers size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
