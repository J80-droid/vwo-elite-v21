import { Activity, Play, RotateCcw, Square } from "lucide-react";
import React from "react";

import { useKinematicsEngine } from "./useKinematicsEngine";

// Helper Component: Segment Editor Row
const SegmentRow = ({
  index,
  duration,
  accel,
  onChange,
  onRemove,
}: {
  index: number;
  duration: number;
  accel: number;
  onChange: (idx: number, field: "duration" | "a", val: number) => void;
  onRemove: (idx: number) => void;
}) => (
  <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg text-[10px] mb-1">
    <div className="w-4 text-center font-bold text-slate-500">{index + 1}</div>

    {/* Duration Input */}
    <div className="flex items-center gap-1 bg-black/20 rounded px-1">
      <span className="text-slate-400">t:</span>
      <input
        type="number"
        value={duration}
        step="0.1"
        min="0.1"
        onChange={(e) =>
          onChange(index, "duration", Math.max(0.1, Number(e.target.value)))
        }
        className="w-8 bg-transparent text-white font-mono outline-none text-right"
      />
      <span className="text-slate-500">s</span>
    </div>

    {/* Accel Input */}
    <div className="flex items-center gap-1 bg-black/20 rounded px-1">
      <span className="text-slate-400">a:</span>
      <input
        type="number"
        value={accel}
        onChange={(e) => onChange(index, "a", Number(e.target.value))}
        className="w-8 bg-transparent text-amber-400 font-mono outline-none text-right"
      />
      <span className="text-slate-500">m/s²</span>
    </div>

    {/* Remove Button */}
    <button
      onClick={() => onRemove(index)}
      className="text-rose-500 hover:text-rose-400 px-1"
    >
      &times;
    </button>
  </div>
);

export const KinematicsSidebar: React.FC = () => {
  const { state, setParam, reset, history } = useKinematicsEngine();

  // Helper handlers for Segment Editor
  const updateSegment = (idx: number, field: "duration" | "a", val: number) => {
    const newSegments = [...(state.segments || [])];
    if (newSegments[idx]) {
      newSegments[idx] = { ...newSegments[idx], [field]: val };
      setParam("segments", newSegments);
    }
  };

  const addSegment = () => {
    const newSegments = [
      ...(state.segments || []),
      { id: Date.now().toString(), duration: 5, a: 0 },
    ];
    setParam("segments", newSegments);
  };

  const removeSegment = (idx: number) => {
    if (state.segments && state.segments.length <= 1) return; // Keep at least one
    const newSegments = (state.segments || []).filter((_, i) => i !== idx);
    setParam("segments", newSegments);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* TOP BAR: Controls & Telemetry */}
      <div className="flex flex-row items-center gap-6">
        {/* Execution Group */}
        {/* Execution Group - Compact 2 Rows */}
        <div className="flex flex-col gap-2">
          {/* Row 1: Playback */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setParam("isPlaying", !state.isPlaying)}
              className={`btn-elite-neon !p-2 flex-1 justify-center ${state.isPlaying ? "btn-elite-neon-rose active" : "btn-elite-neon-emerald"}`}
              title={state.isPlaying ? "Stop" : "Start"}
            >
              {state.isPlaying ? (
                <Square size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
            </button>
            <button
              onClick={reset}
              className="btn-elite-neon btn-elite-neon-blue !p-2 flex-1 justify-center"
              title="Reset (Saves Ghost Run)"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Row 2: Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setParam("showVectors", !state.showVectors)}
              className={`btn-elite-neon !p-2 flex-1 justify-center ${state.showVectors ? "btn-elite-neon-blue active" : "btn-elite-neon-slate"}`}
              title="Toggle Vectors"
            >
              <span className="text-[9px] font-black">VEC</span>
            </button>
            <button
              onClick={() => setParam("ghostMode", !state.ghostMode)}
              className={`btn-elite-neon !p-2 flex-1 justify-center ${state.ghostMode ? "btn-elite-neon-purple active" : "btn-elite-neon-slate"}`}
              title="Ghost Mode (Compare Runs)"
            >
              <span className="text-[9px] font-black">GHOST</span>
            </button>
            <button
              onClick={() => {
                // Optimized CSV Export with Blob
                if (!history.current.length) return;

                const csvContent =
                  "t,x,v,a\n" +
                  history.current
                    .map(
                      (e) =>
                        `${e.t.toFixed(3)},${e.x.toFixed(3)},${e.v.toFixed(3)},${e.a.toFixed(3)}`,
                    )
                    .join("\n");

                const blob = new Blob([csvContent], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", "kinematics_data.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="btn-elite-neon btn-elite-neon-slate !p-2 flex-1 justify-center"
              title="Export CSV (Optimized)"
            >
              <span className="text-[9px] font-black">CSV</span>
            </button>
          </div>
        </div>

        {/* Parameters Group - Inline Sliders */}
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
          {/* Header Icon */}
          <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/20 hidden md:block">
            <Activity className="text-blue-400" size={14} />
          </div>

          {/* X0 */}
          <div className="flex flex-col w-20">
            <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">
              <span>Pos (x₀)</span>
              <span className="text-sky-400">{state.x0} m</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={state.x0}
              onChange={(e) => setParam("x0", Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none accent-sky-500 cursor-pointer hover:bg-white/20 transition-colors"
            />
          </div>

          {/* V0 */}
          <div className="flex flex-col w-20">
            <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">
              <span>Vel (v₀)</span>
              <span className="text-emerald-400">{state.v0} m/s</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={state.v0}
              onChange={(e) => setParam("v0", Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none accent-emerald-500 cursor-pointer hover:bg-white/20 transition-colors"
            />
          </div>

          {/* SEGMENT EDITOR (The Core of Phase 2) */}
          <div className="flex flex-col flex-1 bg-white/5 p-2 rounded-xl border border-white/5 min-w-[200px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                Motion Phases
              </span>
              <button
                onClick={addSegment}
                className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded hover:bg-amber-500/40"
              >
                + ADD
              </button>
            </div>

            <div className="flex flex-col max-h-[80px] overflow-y-auto pr-1 custom-scrollbar">
              {state.segments &&
                state.segments.map((seg, idx) => (
                  <SegmentRow
                    key={idx}
                    index={idx}
                    duration={seg.duration}
                    accel={seg.a}
                    onChange={updateSegment}
                    onRemove={removeSegment}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
