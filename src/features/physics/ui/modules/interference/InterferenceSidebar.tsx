import {
  Crosshair,
  HelpCircle,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Waves,
} from "lucide-react";
import React from "react";

import { useInterferenceEngine } from "./useInterferenceEngine";

export const InterferenceSidebar: React.FC = () => {
  const { state, setParam, setSourceParam, setDetectorParam, reset } =
    useInterferenceEngine();

  return (
    <div className="flex flex-row flex-nowrap items-end gap-2 p-0.5 select-none">
      {/* 1. Global Controls */}
      <div className="pointer-events-auto flex flex-col gap-2 items-center bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 min-w-fit shadow-xl">
        <div className="flex gap-2 w-full justify-center">
          <button
            onClick={() => setParam("isPlaying", !state.isPlaying)}
            className={`btn-elite-neon !p-2 rounded-lg ${state.isPlaying ? "btn-elite-neon-rose active" : "btn-elite-neon-emerald"}`}
            title={state.isPlaying ? "Stop" : "Start"}
          >
            {state.isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
          </button>
          <button
            onClick={reset}
            className="btn-elite-neon btn-elite-neon-blue !p-2 rounded-lg"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
        </div>
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
          Control
        </div>
      </div>

      {/* 2. Wave Parameters */}
      <div className="pointer-events-auto flex flex-col gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 min-w-[160px] shadow-xl">
        <div className="flex justify-between items-center text-[9px] font-black text-sky-400 uppercase tracking-widest px-1">
          <span>Waves</span>
          <Waves size={12} />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[9px] mb-1 font-bold text-slate-400 uppercase">
              <span>f</span>
              <span className="text-white font-mono">
                {state.frequency.toFixed(2)}Hz
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={state.frequency}
              onChange={(e) =>
                setParam("frequency", parseFloat(e.target.value))
              }
              className="w-full h-1 bg-white/10 rounded-full appearance-none accent-sky-400 cursor-pointer hover:bg-white/20 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between text-[9px] mb-1 font-bold text-slate-400 uppercase">
              <span>λ</span>
              <span className="text-white font-mono">
                {(state.wavelength * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={state.wavelength}
              onChange={(e) =>
                setParam("wavelength", parseFloat(e.target.value))
              }
              className="w-full h-1 bg-white/10 rounded-full appearance-none accent-indigo-400 cursor-pointer hover:bg-white/20 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 3. Sources Container (Horizontal) */}
      <div className="flex flex-row flex-nowrap gap-2 items-end">
        {[1, 2].map((id) => {
          const srcKey = `source${id}` as "source1" | "source2";
          const src = state[srcKey];
          const color = id === 1 ? "text-emerald-400" : "text-sky-400";
          const accent = id === 1 ? "accent-emerald-400" : "accent-sky-400";
          const borderActive =
            id === 1 ? "border-emerald-500/30" : "border-sky-500/30";

          return (
            <div
              key={id}
              className={`pointer-events-auto p-2.5 rounded-2xl bg-black/40 backdrop-blur-xl border ${src.active ? borderActive : "border-white/10"} transition-all duration-300 min-w-[130px] shadow-xl ${!src.active ? "opacity-40 grayscale" : ""}`}
            >
              <div className="flex justify-between items-center mb-2 px-1">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${color}`}
                >
                  S{id}
                </span>
                <input
                  type="checkbox"
                  checked={src.active}
                  onChange={(e) =>
                    setSourceParam(srcKey, "active", e.target.checked)
                  }
                  className={`w-3 h-3 rounded bg-black/40 border-white/10 cursor-pointer ${accent}`}
                />
              </div>

              <div className="space-y-2">
                <div className="group">
                  <div className="flex justify-between text-[8px] uppercase font-bold text-slate-500 mb-0.5 px-0.5 group-hover:text-slate-300 transition-colors">
                    <span>X</span>
                    <span className="font-mono">{src.x.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={src.x}
                    onChange={(e) =>
                      setSourceParam(srcKey, "x", parseFloat(e.target.value))
                    }
                    className={`w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer ${accent}`}
                  />
                </div>
                <div className="group">
                  <div className="flex justify-between text-[8px] uppercase font-bold text-slate-500 mb-0.5 px-0.5 group-hover:text-slate-300 transition-colors">
                    <span>Y</span>
                    <span className="font-mono">{src.y.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={src.y}
                    onChange={(e) =>
                      setSourceParam(srcKey, "y", parseFloat(e.target.value))
                    }
                    className={`w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer ${accent}`}
                  />
                </div>
                <div className="group">
                  <div className="flex justify-between text-[8px] uppercase font-bold text-slate-500 mb-0.5 px-0.5 group-hover:text-slate-300 transition-colors">
                    <span>φ</span>
                    <span className="font-mono">
                      {(src.phase / Math.PI).toFixed(1)}π
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.PI * 2}
                    step="0.1"
                    value={src.phase}
                    onChange={(e) =>
                      setSourceParam(
                        srcKey,
                        "phase",
                        parseFloat(e.target.value),
                      )
                    }
                    className={`w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer ${accent}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Display & Tools */}
      <div className="pointer-events-auto flex flex-col gap-2 p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 min-w-fit shadow-xl">
        <div className="flex justify-between items-center text-[9px] font-black text-indigo-400 uppercase tracking-widest px-1">
          <span>View</span>
          <Monitor size={12} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setParam("mode", "instant")}
            className={`flex-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all btn-elite-neon ${state.mode === "instant" ? "btn-elite-neon-cyan active" : "btn-elite-neon-slate"}`}
          >
            Waves
          </button>
          <button
            onClick={() => setParam("mode", "averaged")}
            className={`flex-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all btn-elite-neon ${state.mode === "averaged" ? "btn-elite-neon-cyan active" : "btn-elite-neon-slate"}`}
          >
            Pattern
          </button>
        </div>

        <div className="h-px bg-white/5 my-1" />

        <div className="flex gap-2">
          <button
            onClick={() => setDetectorParam("active", !state.detector.active)}
            className={`btn-elite-neon !py-1.5 !px-3 rounded-lg text-[9px] ${state.detector.active ? "btn-elite-neon-amber active" : "btn-elite-neon-slate"}`}
          >
            <Crosshair size={12} /> PROBE
          </button>
          <button
            onClick={() => setParam("showNodalLines", !state.showNodalLines)}
            className={`btn-elite-neon !py-1.5 !px-3 rounded-lg text-[9px] ${state.showNodalLines ? "btn-elite-neon-indigo active" : "btn-elite-neon-slate"}`}
          >
            <HelpCircle size={12} /> NODES
          </button>
        </div>
      </div>

      {/* 5. Quality & Stats */}
      <div className="pointer-events-auto flex flex-col gap-2 p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 min-w-fit shadow-xl">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
          Engine
        </span>
        <button
          onClick={() => setParam("resolution", state.resolution === 1 ? 2 : 1)}
          className={`btn-elite-neon !py-2 rounded-xl text-[10px] ${state.resolution === 1 ? "btn-elite-neon-emerald active" : "btn-elite-neon-amber active"}`}
        >
          {state.resolution === 1 ? "ULTRA" : "FAST"}
        </button>
        <div className="text-[9px] font-mono text-center text-slate-600 uppercase tracking-tighter">
          60 FPS
        </div>
      </div>
    </div>
  );
};
