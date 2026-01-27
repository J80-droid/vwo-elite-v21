import {
  FlaskConical,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Wind,
  Zap,
} from "lucide-react";
import React from "react";

import { MagnetismParticle, useMagnetismEngine } from "./useMagnetismEngine";

export const MagnetismSidebar: React.FC = React.memo(() => {
  const { state, setParam, addParticle, clearParticles, reset } =
    useMagnetismEngine();

  return (
    <div className="flex flex-row items-end gap-6 p-3 h-full w-full overflow-x-auto custom-scrollbar">
      {/* Playback Controls */}
      <div className="flex flex-col gap-1.5 pb-1">
        <button
          onClick={() => setParam("isPlaying", !state.isPlaying)}
          className={`group p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 border backdrop-blur-md ${
            state.isPlaying
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:bg-rose-500/20"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:bg-emerald-500/20"
          }`}
        >
          {state.isPlaying ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" />
          )}
        </button>
        <button
          onClick={reset}
          className="group p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-xl text-blue-400/70 hover:text-cyan-300 hover:bg-blue-500/10 transition-all duration-300"
        >
          <RotateCcw
            size={16}
            className="group-hover:rotate-180 transition-transform duration-500"
          />
        </button>
      </div>

      {/* Field Controls */}
      <div className="flex flex-col gap-3 min-w-[240px] border-l border-white/5 pl-6">
        {/* Magnetic Field (B) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wind size={12} className="text-cyan-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                B-Veld (Tesla)
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400">
              {state.bField.toFixed(2)}T
            </span>
          </div>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.01"
            value={state.bField}
            onChange={(e) => setParam("bField", parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-cyan-400 cursor-pointer hover:bg-white/20 transition-colors"
          />
        </div>

        {/* Electric Field (E) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-fuchsia-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                E-Veld (V/m)
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-fuchsia-400">
              {state.eField.toFixed(0)}V/m
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={state.eField}
            onChange={(e) => setParam("eField", parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-fuchsia-400 cursor-pointer hover:bg-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Particle Selection */}
      <div className="flex flex-col gap-2 min-w-[220px] border-l border-white/5 pl-6">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1">
          Injecteer Deeltje
        </span>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              type: "proton",
              label: "Proton",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500/20",
            },
            {
              type: "electron",
              label: "Electron",
              color: "text-pink-400",
              bg: "bg-pink-500/10",
              border: "border-pink-500/20",
            },
            {
              type: "alpha",
              label: "Alfa",
              color: "text-amber-400",
              bg: "bg-amber-500/10",
              border: "border-amber-500/20",
            },
            {
              type: "positron",
              label: "Positron",
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
            },
          ].map((p) => (
            <button
              key={p.type}
              onClick={() => addParticle(p.type as MagnetismParticle["type"])}
              className={`px-3 py-2 rounded-lg border ${p.bg} ${p.border} transition-all hover:scale-[1.05] active:scale-[0.95] flex items-center justify-between group`}
            >
              <span className={`text-[9px] font-black uppercase ${p.color}`}>
                {p.label}
              </span>
              <div
                className={`w-1 h-3 rounded-full ${p.color.replace(
                  "text",
                  "bg",
                )}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Tools Area */}
      <div className="flex flex-col gap-2 ml-auto min-w-[120px] border-l border-white/5 pl-6">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1">
          Tools
        </span>
        <div className="flex gap-2">
          <button
            onClick={clearParticles}
            className="flex-1 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex flex-col items-center justify-center gap-1 hover:bg-rose-500/20 transition-all group"
            title="Wis alle deeltjes"
          >
            <Trash2 size={16} />
            <span className="text-[8px] font-black uppercase tracking-widest">
              Clear
            </span>
          </button>
          <button
            onClick={() => setParam("showBField", !state.showBField)}
            className={`flex-1 py-3 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all group ${
              state.showBField
                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
            }`}
            title="Toon/Verberg B-Veld"
          >
            <Wind size={16} />
            <span className="text-[8px] font-black uppercase tracking-widest">
              B-Veld
            </span>
          </button>
          <button
            onClick={() => setParam("showEField", !state.showEField)}
            className={`flex-1 py-3 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all group ${
              state.showEField
                ? "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.1)]"
                : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
            }`}
            title="Toon/Verberg E-Veld"
          >
            <Zap size={16} />
            <span className="text-[8px] font-black uppercase tracking-widest">
              E-Veld
            </span>
          </button>
          <button
            onClick={() => setParam("showGrid", !state.showGrid)}
            className={`flex-1 py-3 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all group ${
              state.showGrid
                ? "bg-slate-500/10 border-slate-500/20 text-slate-400 shadow-[0_0_10px_rgba(100,116,139,0.1)]"
                : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
            }`}
            title="Toon/Verberg Grid"
          >
            <FlaskConical size={16} />
            <span className="text-[8px] font-black uppercase tracking-widest">
              Grid
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});
MagnetismSidebar.displayName = "MagnetismSidebar";
