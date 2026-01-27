import {
  Activity,
  Atom,
  Clock,
  MoveHorizontal,
  Pause,
  Play,
  RotateCcw,
  Sigma,
  Trash2,
  Volume2,
  VolumeX,
  Weight,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { useQuantumAudio } from "./useQuantumAudio";
import { useQuantumEngine } from "./useQuantumEngine";

export const QuantumSidebar: React.FC = () => {
  const state = useQuantumEngine();
  const { setParam, toggleState, reset, clearMeasurements } = state;

  // Safe time initialization
  const [now, setNow] = useState(0);
  const [muted, setMuted] = useState(false);

  const { resume } = useQuantumAudio(muted);

  useEffect(() => {
    if (state.lastPhoton) {
      const timeout = setTimeout(() => setNow(Date.now()), 0);
      const interval = setInterval(() => setNow(Date.now()), 100);
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
    return undefined;
  }, [state.lastPhoton]);

  const energyColors = [
    "text-violet-400 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] bg-violet-500/10",
    "text-blue-400 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-blue-500/10",
    "text-cyan-400 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-cyan-500/10",
    "text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-emerald-500/10",
    "text-lime-400 border-lime-500 shadow-[0_0_15px_rgba(163,230,53,0.3)] bg-lime-500/10",
    "text-amber-400 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-amber-500/10",
    "text-orange-400 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] bg-orange-500/10",
    "text-rose-400 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] bg-rose-500/10",
  ];

  return (
    <div className="flex flex-row flex-nowrap items-stretch gap-3 select-none pointer-events-auto justify-center">
      {/* 2. Params & Playback */}
      <div className="flex flex-col gap-2 p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl min-w-[180px]">
        <div className="flex gap-2">
          <button
            onClick={() => setParam("isPlaying", !state.isPlaying)}
            className={`flex-1 py-1.5 flex items-center justify-center gap-2 rounded border transition-all ${
              state.isPlaying
                ? "bg-violet-500/20 border-violet-500 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            } `}
            title={state.isPlaying ? "Pause" : "Play"}
          >
            {state.isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
          </button>

          <button
            onClick={() => {
              setMuted(!muted);
              resume();
            }}
            className={`w-10 flex items-center justify-center rounded border transition-all ${muted ? "bg-red-500/20 border-red-500 text-red-400" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"}`}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <button
            onClick={reset}
            className="w-10 flex items-center justify-center rounded bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all hover:scale-105 active:scale-95"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="h-px bg-white/5 w-full my-1" />

        <div className="flex gap-2">
          <button
            onClick={() => setParam("potentialType", "infinite-well")}
            className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded border transition-all ${state.potentialType === "infinite-well" ? "border-violet-500 text-violet-400 bg-violet-500/10 shadow-[0_0_10px_rgba(139,92,246,0.2)]" : "border-white/5 text-slate-500 hover:text-violet-400 hover:bg-violet-500/5"} `}
          >
            Well
          </button>
          <button
            onClick={() => setParam("potentialType", "harmonic")}
            className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded border transition-all ${state.potentialType === "harmonic" ? "border-rose-500 text-rose-400 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.2)]" : "border-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5"} `}
          >
            Harmonic
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setParam("showExpectation", !state.showExpectation)}
            className={`flex-1 py-1.5 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-wider rounded border transition-all ${state.showExpectation ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-white/5 border-transparent text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/5"} `}
            title="Show Expectation Value"
          >
            <Activity size={12} />
            &lt;x&gt;
          </button>

          <button
            onClick={() => setParam("showFormulas", !state.showFormulas)}
            className={`flex-1 py-1.5 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-wider rounded border transition-all ${state.showFormulas ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-white/5 border-transparent text-slate-500 hover:text-amber-400 hover:bg-amber-500/5"} `}
            title="Show Math"
          >
            <Sigma size={12} />
            Math
          </button>
        </div>
      </div>

      {/* 3. System Controls */}
      <div className="flex flex-col gap-1.5 p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl min-w-[200px]">
        {/* Width */}
        <div className="space-y-0">
          <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold tracking-wider">
            <div className="flex items-center gap-1">
              <MoveHorizontal size={10} /> <span>Width (L)</span>
            </div>
            <span className="text-white font-mono">
              {state.wellWidth.toFixed(1)} nm
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="10.0"
            step="0.1"
            value={state.wellWidth}
            onChange={(e) => setParam("wellWidth", parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 hover:[&::-webkit-slider-thumb]:bg-white transition-all cursor-pointer"
          />
        </div>

        {/* Mass */}
        <div className="space-y-0">
          <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold tracking-wider">
            <div className="flex items-center gap-1">
              <Weight size={10} /> <span>Mass (m)</span>
            </div>
            <span className="text-white font-mono">
              {state.mass.toFixed(1)} m₀
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={state.mass}
            onChange={(e) => setParam("mass", parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400 hover:[&::-webkit-slider-thumb]:bg-white transition-all cursor-pointer"
          />
        </div>

        {/* Speed */}
        <div className="space-y-0 pt-1 border-t border-white/5">
          <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold tracking-wider">
            <div className="flex items-center gap-1">
              <Clock size={10} /> <span>Speed</span>
            </div>
            <span className="text-white font-mono">
              {state.simulationSpeed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={state.simulationSpeed}
            onChange={(e) =>
              setParam("simulationSpeed", parseFloat(e.target.value))
            }
            className="w-full h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-400 hover:[&::-webkit-slider-thumb]:bg-white transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Energy Levels */}
      <div className="flex flex-col gap-2 p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl min-w-[160px]">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
          Energy Levels
        </span>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => {
            const isActive = state.activeStates.some((s) => s.n === n);
            const activeStyle = energyColors[i];

            return (
              <button
                key={n}
                onClick={() => toggleState(n)}
                onMouseEnter={() => setParam("hoveredState", n)}
                onMouseLeave={() => setParam("hoveredState", null)}
                className={`
                  w-full aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-300 border
                  ${
                    isActive
                      ? activeStyle + " scale-105"
                      : "bg-white/5 border-white/5 text-slate-600 hover:bg-white/10 hover:text-slate-400 hover:border-white/10"
                  }
                `}
                title={`Toggle State n=${n}`}
              >
                <span className="text-[10px] font-bold leading-none">n{n}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-current shadow-[0_0_5px_currentColor] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. View Modes */}
      <div className="flex flex-col gap-2 p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl min-w-[120px]">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
          View Mode
        </span>
        <div className="flex flex-col gap-2 h-full justify-center">
          <button
            onClick={() => setParam("viewMode", "real")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
              state.viewMode === "real"
                ? "bg-violet-500/10 border-violet-500 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                : "bg-white/5 border-transparent text-slate-500 hover:text-white hover:bg-white/10"
            } `}
          >
            Real
          </button>
          <button
            onClick={() => setParam("viewMode", "probability")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
              state.viewMode === "probability"
                ? "bg-rose-500/10 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                : "bg-white/5 border-transparent text-slate-500 hover:text-white hover:bg-white/10"
            } `}
          >
            Prob
          </button>
          <button
            onClick={() => setParam("viewMode", "complex")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
              state.viewMode === "complex"
                ? "bg-amber-500/10 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                : "bg-white/5 border-transparent text-slate-500 hover:text-white hover:bg-white/10"
            } `}
          >
            Phase
          </button>
        </div>
      </div>

      {/* 6. Results */}
      <div className="flex flex-col gap-2 p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl min-w-[180px]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Measurements
          </span>
          <div className="flex gap-1">
            <span className="text-[9px] font-mono text-violet-400">
              N={state.totalMeasurements}
            </span>
            {state.totalMeasurements > 0 && (
              <button
                onClick={clearMeasurements}
                className="text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="bg-black/50 rounded-lg p-2 border border-white/5 flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 ${state.lastPhoton && now - state.lastPhoton.timestamp < 2000 ? "scale-110 shadow-[0_0_15px_currentColor]" : "opacity-30 grayscale"} `}
            style={{
              borderColor: state.lastPhoton?.color || "#333",
              color: state.lastPhoton?.color || "#333",
              backgroundColor: state.lastPhoton?.color
                ? `${state.lastPhoton.color} 20`
                : "transparent",
            }}
          >
            <Atom size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 uppercase font-bold">
              Spectral Detector
            </span>
            {state.lastPhoton ? (
              <div className="flex flex-col leading-none">
                <span className="text-[12px] font-mono font-bold text-white">
                  {state.lastPhoton.wavelength} nm
                </span>
                <span className="text-[8px] text-slate-400 truncate w-20">
                  Energy Drop detected
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-600 italic">
                No emission
              </span>
            )}
          </div>
        </div>

        {state.totalMeasurements === 0 && (
          <div className="text-[9px] text-slate-600 italic px-1">
            Click graph to measure particle position (verify |Ψ|²)
          </div>
        )}
      </div>
    </div>
  );
};
