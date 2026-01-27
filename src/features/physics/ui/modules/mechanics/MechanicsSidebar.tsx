import { Play, RotateCcw, Square } from "lucide-react";
import React from "react";

import { useMechanicsEngine } from "./useMechanicsEngine";

export const MechanicsSidebar: React.FC = () => {
  const { state, setParam, reset } = useMechanicsEngine();

  return (
    <div className="flex flex-row items-center gap-6">
      {/* Execution Group */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setParam("isPlaying", !state.isPlaying)}
          className={`btn-elite-neon !p-3 ${state.isPlaying ? "btn-elite-neon-rose active" : "btn-elite-neon-emerald"}`}
          title={state.isPlaying ? "Stop" : "Start"}
        >
          {state.isPlaying ? (
            <Square size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
        </button>
        <button
          onClick={reset}
          className="btn-elite-neon btn-elite-neon-blue !p-3"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Parameters Group - Inline Sliders */}
      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
        {/* Angle */}
        <div className="flex flex-col w-24">
          <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">
            <span>Angle</span>
            <span className="text-sky-400">{state.angle}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={state.angle}
            onChange={(e) => setParam("angle", Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-sky-500 cursor-pointer hover:bg-white/20 transition-colors"
          />
        </div>

        {/* Friction */}
        <div className="flex flex-col w-24">
          <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">
            <span>Friction</span>
            <span className="text-emerald-400">{state.mu.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.mu}
            onChange={(e) => setParam("mu", Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-emerald-500 cursor-pointer hover:bg-white/20 transition-colors"
          />
        </div>

        {/* Mass */}
        <div className="flex flex-col w-24">
          <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">
            <span>Mass</span>
            <span className="text-amber-400">{state.mass} kg</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={state.mass}
            onChange={(e) => setParam("mass", Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-amber-500 cursor-pointer hover:bg-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Status Indicator (Glass Card) */}
      <div className="flex flex-col gap-1 pr-6 pl-4 border-l border-white/10 relative">
        <div className="absolute inset-0 bg-white/5 blur-md -z-10 rounded-lg"></div>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">
          Sim Time
        </span>
        <span className="text-xl font-mono text-white leading-none tracking-tight shadow-glow">
          {state.time.toFixed(2)}
          <span className="text-xs text-slate-500 ml-1">s</span>
        </span>
      </div>
    </div>
  );
};
