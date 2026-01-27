import {
  Activity,
  Box,
  Pause,
  Play,
  Plus,
  Rocket,
  RotateCcw,
  Ruler,
  Trash2,
} from "lucide-react";
import React from "react";

import { useAstroEngine } from "./useAstroEngine";

const Divider = () => <div className="w-px h-8 bg-white/10 mx-1" />;

const ControlGroup = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`flex items-center gap-2 ${className}`}>{children}</div>;

export const AstroSidebar: React.FC = () => {
  const {
    centralMass,
    timeScale,
    isPlaying,
    showAnalysis,
    showVectors,
    viewMode,
    showHohmann,
    setParam,
    togglePlay,
    reset,
    addRandomPlanet,
    clearTrails,
    toggleAnalysis,
    toggleVectors,
    toggleViewMode,
    toggleHohmann,
  } = useAstroEngine();

  return (
    <div className="w-auto max-w-[90vw] pointer-events-auto mx-auto relative">
      <div className="bg-[#050505]/80 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-4 relative overflow-hidden">
        {/* Play / Reset */}
        <ControlGroup>
          <button
            onClick={togglePlay}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
              isPlaying
                ? "bg-white/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <button
            onClick={reset}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-white transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </ControlGroup>

        <Divider />

        {/* Compact Sliders */}
        <div className="flex gap-4 px-2">
          <div className="w-24 space-y-1 group">
            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
              <span>Mass</span>{" "}
              <span className="text-cyan-400 group-hover:text-white transition-colors">
                {(centralMass / 1000).toFixed(0)}k
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={centralMass}
              onChange={(e) => setParam("centralMass", Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
            />
          </div>
          <div className="w-24 space-y-1 group">
            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
              <span>Time</span>{" "}
              <span className="text-purple-400 group-hover:text-white transition-colors">
                {timeScale.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="10.0"
              step="0.1"
              value={timeScale}
              onChange={(e) => setParam("timeScale", Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400"
            />
          </div>
        </div>

        <Divider />

        {/* View Toggles */}
        <ControlGroup>
          <button
            onClick={toggleViewMode}
            className={`flex flex-col items-center justify-center w-10 h-9 rounded-lg transition-all ${viewMode === "3D" ? "text-blue-400" : "text-slate-500 hover:text-white"}`}
            title="3D View"
          >
            <Box size={16} />
            <span className="text-[8px] font-bold mt-0.5">3D</span>
          </button>

          <button
            onClick={toggleAnalysis}
            className={`flex flex-col items-center justify-center h-9 px-3 rounded-lg transition-all border ${showAnalysis ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200" : "border-transparent text-slate-500 hover:text-white"}`}
            title="Toggle Analysis"
          >
            <Activity size={16} />
            <span className="text-[8px] font-bold mt-0.5">DATA</span>
          </button>

          <button
            onClick={toggleHohmann}
            className={`flex flex-col items-center justify-center h-9 px-3 rounded-lg transition-all border ${showHohmann ? "bg-orange-500/20 border-orange-500/50 text-orange-200" : "border-transparent text-slate-500 hover:text-white"}`}
            title="Hohmann Transfer"
          >
            <Rocket size={16} />
            <span className="text-[8px] font-bold mt-0.5">ORBIT</span>
          </button>
        </ControlGroup>

        <Divider />

        {/* Tools (Icons only) */}
        <div className="flex gap-1">
          <button
            onClick={addRandomPlanet}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-500/80 hover:text-emerald-400 hover:bg-white/5 transition-all"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={toggleVectors}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${showVectors ? "text-yellow-400 bg-yellow-400/10" : "text-slate-600 hover:text-yellow-400 hover:bg-white/5"}`}
          >
            <Ruler size={16} />
          </button>
          <button
            onClick={clearTrails}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500/80 hover:text-rose-400 hover:bg-white/5 transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
