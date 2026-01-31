import { Zap } from "lucide-react";
import React, { useState } from "react";

import {
  getPotential,
  HALF_CELLS,
  HalfCeil,
} from "./data/ElectrochemistryData";

// Beaker Component - defined outside to prevent re-creation on render
interface BeakerProps {
  cell: HalfCeil;
  side: "left" | "right";
  onChange: (c: HalfCeil) => void;
  isRunning: boolean;
}

const Beaker: React.FC<BeakerProps> = ({ cell, side, onChange, isRunning }) => (
  <div className="flex flex-col items-center gap-4 w-64">
    <div className="w-full bg-black/40 p-3 rounded-xl border border-white/10">
      <label className="text-xs text-slate-500 font-bold uppercase block mb-2">
        {side === "left" ? "Elektrode 1" : "Elektrode 2"}
      </label>
      <select
        value={cell.id}
        onChange={(e) =>
          onChange(HALF_CELLS.find((c) => c.id === e.target.value)!)
        }
        className="w-full bg-obsidian-950 text-white p-2 rounded outline-none border border-white/10"
      >
        {HALF_CELLS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.couple} ({c.E0 > 0 ? "+" : ""}
            {c.E0.toFixed(2)}V)
          </option>
        ))}
      </select>
    </div>

    {/* Visual Beaker */}
    <div className="relative w-48 h-64 border-x-2 border-b-2 border-white/20 rounded-b-xl bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm overflow-hidden">
      {/* Solution */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-3/4 ${cell.color} transition-colors duration-500`}
      />

      {/* Electrode */}
      <div
        className={`absolute top-[-20px] left-1/2 -translate-x-1/2 w-8 h-56 bg-gradient-to-r from-slate-400 to-slate-200 shadow-xl ${cell.id === "cu" ? "from-orange-700 to-orange-500" : ""} ${cell.id === "zn" ? "from-slate-400 to-slate-300" : ""} ${cell.id === "ag" ? "from-slate-200 to-white" : ""}`}
      />

      {/* Bubbles if gas */}
      {isRunning && cell.id === "h" && (
        <div className="absolute bottom-0 left-1/2 w-full h-full pointer-events-none">
          {/* Simple CSS animation would go here */}
          <div className="text-center mt-32 text-white/50 text-xs">
            Gasbellen (H2)
          </div>
        </div>
      )}
    </div>

    <div className="text-center">
      <div className="text-xl font-bold text-white">{cell.metal}</div>
      <div className="text-sm font-mono text-slate-400">{cell.reduction}</div>
    </div>
  </div>
);

export const ElectrochemistrySim: React.FC<{
  mode?: "sidebar" | "main" | "stage" | "controls";
}> = ({ mode }) => {
  // State
  const [leftCell, setLeftCell] = useState<HalfCeil>(
    HALF_CELLS.find((c) => c.id === "zn")!,
  );
  const [rightCell, setRightCell] = useState<HalfCeil>(
    HALF_CELLS.find((c) => c.id === "cu")!,
  );
  const [isRunning, setIsRunning] = useState(false);

  // Calculations
  // Determine which is Anode/Cathode based on natural spontaneity (Galvanic)
  // Detailed logic: The one with higher E0 is Cathode (Reduction).

  // However, to allow user exploration (and mistakes), we let the physical setup dictate potential.
  // Standard convention: Left = Anode (Oxidation), Right = Cathode (Reduction).
  // Cell Potential = E(right) - E(left).
  // If positive -> Spontaneous (Galvanic). If negative -> Electrolysis needed (or reverse reaction).

  // For VWO default: We assume user places metals and we measure voltage.
  const voltage = getPotential(rightCell, leftCell);

  // If voltage > 0: Electron flow Left -> Right.
  // If voltage < 0: Electron flow Right -> Left.
  const flowDirection = voltage > 0 ? "right" : "left";

  if (mode === "controls") {
    return (
      <div className="flex flex-row items-center gap-4">
        {/* Electrode 1 Selection */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Elektrode 1</span>
          <select
            value={leftCell.id}
            onChange={(e) => setLeftCell(HALF_CELLS.find((c) => c.id === e.target.value)!)}
            className="bg-transparent text-[10px] text-white outline-none font-bold py-1 pr-4"
          >
            {HALF_CELLS.map((c) => (
              <option key={c.id} value={c.id} className="bg-obsidian-950">
                {c.couple} ({c.E0 > 0 ? "+" : ""}{c.E0.toFixed(2)}V)
              </option>
            ))}
          </select>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Electrode 2 Selection */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Elektrode 2</span>
          <select
            value={rightCell.id}
            onChange={(e) => setRightCell(HALF_CELLS.find((c) => c.id === e.target.value)!)}
            className="bg-transparent text-[10px] text-white outline-none font-bold py-1 pr-4"
          >
            {HALF_CELLS.map((c) => (
              <option key={c.id} value={c.id} className="bg-obsidian-950">
                {c.couple} ({c.E0 > 0 ? "+" : ""}{c.E0.toFixed(2)}V)
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isRunning ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-500/10' : 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'}`}
        >
          <Zap size={14} className={isRunning ? "animate-pulse" : ""} />
          {isRunning ? "Meting Stoppen" : "Meting Starten"}
        </button>

        {/* Voltage Display Mini */}
        {isRunning && (
          <div className="ml-auto flex items-center gap-3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Measured</span>
              <span className="text-[12px] font-black text-yellow-400 leading-tight">{Math.abs(voltage).toFixed(2)}V</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === "stage") {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 relative overflow-hidden bg-black">
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none z-0">
          <h1 className="text-[12rem] font-black tracking-tighter text-white">
            VWO ELITE
          </h1>
        </div>

        <div className="relative flex items-end gap-32 z-10">
          {/* Salt Bridge */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-64 h-24 border-t-8 border-x-8 border-white/10 rounded-t-3xl pointer-events-none z-0 opacity-50">
            <div className="w-full h-full bg-blue-500/5 rounded-t-2xl" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 uppercase font-black bg-black px-3 tracking-widest">
              Zoutbrug (KNO₃)
            </div>
          </div>

          {/* Wire & Voltmeter */}
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[400px] h-32 border-t-4 border-x-4 border-yellow-500/50 rounded-t-full pointer-events-none flex justify-center">
            <div className={`bg-obsidian-900 border-4 ${isRunning ? 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'border-white/10'} rounded-full w-24 h-24 -mt-12 flex items-center justify-center transition-all duration-500`}>
              <div className={`text-2xl font-mono font-black ${isRunning ? 'text-yellow-400' : 'text-slate-700'}`}>
                {isRunning ? Math.abs(voltage).toFixed(2) : "OFF"}
                {isRunning && <span className="text-xs ml-0.5">V</span>}
              </div>
            </div>

            {/* Electrons Animation */}
            {isRunning && (
              <div
                className={`absolute top-[-10px] w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_15px_yellow]`}
                style={{
                  offsetPath: 'path("M 0 100 Q 200 -50 400 100")',
                  animation: `electron-${flowDirection} 2s infinite linear`,
                }}
              />
            )}
          </div>

          <Beaker
            cell={leftCell}
            side="left"
            onChange={setLeftCell}
            isRunning={isRunning}
          />
          <Beaker
            cell={rightCell}
            side="right"
            onChange={setRightCell}
            isRunning={isRunning}
          />
        </div>

        {/* Reaction Info Overlay */}
        {isRunning && (
          <div className="absolute bottom-12 right-12 max-w-sm w-full bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Reactie Analyse</div>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex items-center justify-between text-rose-400">
                <span className="font-black uppercase">Anode (-)</span>
                <span>{leftCell.metal} → {leftCell.ion} + e⁻</span>
              </div>
              <div className="flex items-center justify-between text-cyan-400">
                <span className="font-black uppercase">Kathode (+)</span>
                <span>{rightCell.ion} + e⁻ → {rightCell.metal}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Bronspanning</span>
              <span className="text-sm font-black text-yellow-500">{Math.abs(voltage).toFixed(2)}V</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-obsidian-950 flex items-center justify-center p-6 grayscale opacity-20 border-2 border-dashed border-white/5 rounded-3xl m-4">
      <div className="text-center">
        <div className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Full mode rendering is deactivated</div>
        <div className="text-[10px] text-slate-600 italic">Please use mode="stage" and mode="controls"</div>
      </div>
    </div>
  );
};
