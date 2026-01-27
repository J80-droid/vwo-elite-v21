import {
  Play,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import React from "react";

import { useWavesEngine, WaveParams } from "./useWavesEngine";
import { useWaveSonification } from "./useWaveSonification";

const WaveControls: React.FC<{
  label: string;
  wave: WaveParams;
  colorClass: string;
  onChange: (key: keyof WaveParams, val: number) => void;
  onRemove?: () => void;
  freqDisabled?: boolean;
}> = ({ label, wave, colorClass, onChange, onRemove, freqDisabled }) => {
  return (
    <div className="pointer-events-auto bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 relative group flex flex-col justify-center min-w-fit shadow-xl">
      <div className="flex justify-between items-center mb-1 px-1">
        <span
          className={`text-[10px] font-black uppercase tracking-wider ${colorClass}`}
        >
          {label}
        </span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-slate-600 hover:text-rose-400 transition-colors"
            title="Remove Source"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {/* Frequency */}
        <div className="flex flex-col">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
            <span>Freq</span>
            <span className="text-white font-mono">{wave.f.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={wave.f}
            disabled={freqDisabled}
            onChange={(e) => onChange("f", Number(e.target.value))}
            className={`w-full h-1 rounded-full appearance-none cursor-pointer transition-colors ${freqDisabled ? "bg-slate-700 cursor-not-allowed opacity-50" : `bg-white/10 hover:bg-white/20 accent-${colorClass.replace("text-", "")}`}`}
          />
        </div>

        {/* Amplitude */}
        <div className="flex flex-col">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
            <span>Amp</span>
            <span className="text-white font-mono">{wave.A.toFixed(0)}</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={wave.A}
            onChange={(e) => onChange("A", Number(e.target.value))}
            className={`w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:bg-white/20 transition-colors accent-${colorClass.replace("text-", "")}`}
          />
        </div>

        {/* Phase */}
        <div className="flex flex-col">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
            <span>Phase</span>
            <span className="text-white font-mono">{wave.phi.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.PI * 2}
            step={0.1}
            value={wave.phi}
            onChange={(e) => onChange("phi", Number(e.target.value))}
            className={`w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:bg-white/20 transition-colors accent-${colorClass.replace("text-", "")}`}
          />
        </div>

        {/* Pos */}
        <div className="flex flex-col">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
            <span>Pos</span>
            <span className="text-white font-mono">
              {wave.xOffset?.toFixed(0) || 0}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="600"
            step="10"
            value={wave.xOffset || 0}
            onChange={(e) => onChange("xOffset", Number(e.target.value))}
            className={`w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:bg-white/20 transition-colors accent-${colorClass.replace("text-", "")}`}
          />
        </div>
      </div>
    </div>
  );
};

export const WavesSidebar: React.FC = () => {
  const {
    state,
    setParam,
    setWaveParam,
    setHarmonicsParam,
    setProbeParam,
    setMediumParam,
    reset,
  } = useWavesEngine();
  const { isMuted, toggleMute } = useWaveSonification(state);

  const applyPreset = (mode: "standing" | "beats" | "default" | "string") => {
    if (mode !== "string") setHarmonicsParam("isEnabled", false);
    if (mode === "default") {
      setWaveParam("wave1", "active", true);
      setWaveParam("wave1", "direction", 1);
      setWaveParam("wave2", "active", false);
    } else if (mode === "standing") {
      const f = state.wave1?.f || 1;
      const A = state.wave1?.A || 50;
      setWaveParam("wave1", "direction", 1);
      setWaveParam("wave2", "active", true);
      setWaveParam("wave2", "f", f);
      setWaveParam("wave2", "A", A);
      setWaveParam("wave2", "direction", -1);
    } else if (mode === "beats") {
      const f = state.wave1?.f || 1;
      setWaveParam("wave1", "direction", 1);
      setWaveParam("wave2", "active", true);
      setWaveParam("wave2", "f", f + 0.2);
      setWaveParam("wave2", "A", state.wave1?.A || 50);
      setWaveParam("wave2", "direction", 1);
    } else if (mode === "string") {
      setHarmonicsParam("isEnabled", true);
      setParam("isPlaying", true);
    }
  };

  return (
    <div className="flex flex-row flex-nowrap items-end gap-2 p-0.5 select-none">
      {/* 1. Global Controls */}
      <div className="pointer-events-auto flex flex-col gap-1 items-center bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 min-w-fit shadow-xl">
        <div className="flex gap-2 w-full justify-center">
          <button
            onClick={() => setParam("isPlaying", !state.isPlaying)}
            className={`btn-elite-neon !p-2 rounded-lg ${state.isPlaying ? "btn-elite-neon-rose active" : "btn-elite-neon-emerald"}`}
            title={state.isPlaying ? "Stop" : "Start"}
          >
            {state.isPlaying ? (
              <Square size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
          </button>
          <button
            onClick={() => reset("soft")}
            className="btn-elite-neon btn-elite-neon-blue !p-2 rounded-lg"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={toggleMute}
            className={`btn-elite-neon !p-2 rounded-lg ${!isMuted ? "btn-elite-neon-amber active" : "btn-elite-neon-slate"}`}
            title="Sound"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
        {/* Speed Slider Compact */}
        <div className="w-full mt-1 px-1">
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={state.timeScale || 1.0}
            onChange={(e) => setParam("timeScale", parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            title={`Speed: ${state.timeScale}x`}
          />
        </div>
      </div>

      {/* 2. Mode Presets */}
      <div className="pointer-events-auto grid grid-cols-2 gap-2 p-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 min-w-fit shadow-xl">
        <button
          onClick={() => applyPreset("default")}
          className={`px-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${!state.harmonics?.isEnabled && !state.wave2?.active ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-white bg-white/5"}`}
        >
          Single
        </button>
        <button
          onClick={() => applyPreset("beats")}
          className={`px-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${state.wave2?.active && !state.harmonics?.isEnabled ? "bg-sky-500/20 border-sky-500 text-sky-400" : "border-transparent text-slate-500 hover:text-white bg-white/5"}`}
        >
          Beats
        </button>
        <button
          onClick={() => applyPreset("standing")}
          className={`px-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${state.wave2?.active && state.wave2?.direction === -1 ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 hover:text-white bg-white/5"}`}
        >
          Stand
        </button>
        <button
          onClick={() => applyPreset("string")}
          className={`px-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${state.harmonics?.isEnabled ? "bg-rose-500/20 border-rose-500 text-rose-400" : "border-transparent text-slate-500 hover:text-white bg-white/5"}`}
        >
          String
        </button>
      </div>

      {/* 3. Strings / Medium (Conditional) */}
      {state.harmonics?.isEnabled && (
        <div className="pointer-events-auto flex flex-col gap-2 p-2 bg-rose-500/10 backdrop-blur-xl rounded-2xl border border-rose-500/20 min-w-fit shadow-xl">
          <div className="flex justify-between items-center text-[9px] font-black text-rose-400 uppercase tracking-widest px-1">
            <span>String Harmonics</span>
            <span className="bg-rose-500 text-white px-1.5 rounded text-[10px]">
              n={state.harmonics.n}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={state.harmonics.n}
            onChange={(e) => setHarmonicsParam("n", parseInt(e.target.value))}
            className="w-full h-2 bg-rose-500/20 rounded-full appearance-none accent-rose-500 cursor-pointer mb-1"
          />

          {/* Boundary Selector */}
          <div className="flex bg-black/20 rounded-lg p-0.5 mb-2 mt-2">
            {(["string", "closed", "open"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setHarmonicsParam("mode", m)}
                className={`flex-1 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  state.harmonics.mode === m
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-rose-300/50 hover:text-rose-300"
                }`}
              >
                {m === "string"
                  ? "Snaar"
                  : m === "closed"
                    ? "1x Open"
                    : "2x Open"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Tension
              </span>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={state.medium?.tension || 50}
                onChange={(e) =>
                  setMediumParam("tension", Number(e.target.value))
                }
                className="h-1.5 w-full bg-black/20 rounded-full accent-rose-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Density
              </span>
              <input
                type="range"
                min="0.0001"
                max="0.001"
                step="0.0001"
                value={state.medium?.density || 0.0002}
                onChange={(e) =>
                  setMediumParam("density", Number(e.target.value))
                }
                className="h-1.5 w-full bg-black/20 rounded-full accent-rose-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Sources */}
      <div className="flex flex-row flex-nowrap gap-2 items-end">
        {state.wave1 && (
          <WaveControls
            label="Wave 1 (Source)"
            wave={state.wave1}
            colorClass="text-emerald-400"
            onChange={(k, v) => setWaveParam("wave1", k, v)}
            freqDisabled={state.harmonics?.isEnabled}
          />
        )}

        {state.wave2?.active ? (
          <WaveControls
            label="Wave 2 (Interference)"
            wave={state.wave2}
            colorClass="text-sky-400"
            onChange={(k, v) => setWaveParam("wave2", k, v)}
            onRemove={() => setWaveParam("wave2", "active", false)}
          />
        ) : (
          <button
            onClick={() => setWaveParam("wave2", "active", true)}
            className="pointer-events-auto flex flex-col items-center justify-center w-12 h-20 rounded-2xl border border-dashed border-white/10 hover:border-sky-400/50 hover:bg-sky-400/10 text-slate-500 hover:text-sky-400 transition-all opacity-50 hover:opacity-100 shadow-lg shrink-0"
            title="Add Wave 2"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* 5. Tools & Analysis */}
      <div className="pointer-events-auto flex flex-col gap-2 p-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 min-w-fit shadow-xl">
        <div className="flex gap-2">
          <button
            onClick={() => setProbeParam("isActive", !state.probe?.isActive)}
            className={`btn-elite-neon !py-1.5 !px-3 rounded-lg text-[10px] ${state.probe?.isActive ? "btn-elite-neon-rose active" : "btn-elite-neon-slate"}`}
          >
            Probe
          </button>
          <button
            onClick={() => setParam("isLongitudinal", !state.isLongitudinal)}
            className={`btn-elite-neon !py-1.5 !px-3 rounded-lg text-[10px] ${state.isLongitudinal ? "btn-elite-neon-amber active" : "btn-elite-neon-slate"}`}
          >
            Long
          </button>
        </div>

        {/* Equation Monitor */}
        <div className="mt-auto bg-black/20 rounded p-1.5 border border-white/5">
          <span className="text-[9px] font-black text-slate-500 uppercase block mb-0.5">
            Stats
          </span>
          <div className="text-[10px] font-mono text-white flex justify-between gap-4">
            <span>t:</span>
            <span>{state.time.toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
