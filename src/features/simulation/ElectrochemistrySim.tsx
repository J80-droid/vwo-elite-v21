import { Activity, Battery, Zap } from "lucide-react";
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

export const ElectrochemistrySim: React.FC<{ mode?: "sidebar" | "main" }> = ({
  mode,
}) => {
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

  if (mode === "sidebar") {
    const measuredV = isRunning ? Math.abs(voltage).toFixed(2) : "---";
    return (
      <div className="space-y-4 pt-4">
        <div className="bg-obsidian-900 p-4 rounded-xl border border-white/10 text-center">
          <div className="text-xs text-slate-500 mb-1 uppercase tracking-widest">
            Voltmeter
          </div>
          <div className="text-4xl font-mono font-bold text-yellow-400 flex items-center justify-center gap-2">
            {measuredV} <span className="text-sm text-slate-500">V</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`btn-elite-glass flex-1 !py-3 !rounded-xl ${isRunning ? "btn-elite-rose active" : "btn-elite-emerald active"}`}
          >
            {isRunning ? "Stop Meting" : "Start Meting"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-obsidian-950 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
        <Battery className="text-yellow-400" /> Elektrochemische Cel
      </h1>
      <p className="text-slate-400 mb-12">
        Bouw een galvanische cel en meet de bronspanning.
      </p>

      <div className="relative flex items-end gap-32">
        {/* Salt Bridge */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-64 h-24 border-t-8 border-x-8 border-white/10 rounded-t-3xl pointer-events-none z-0 opacity-50">
          <div className="w-full h-full bg-blue-500/5 rounded-t-2xl" />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-600 uppercase font-bold bg-obsidian-950 px-2">
            Zoutbrug (KNO3)
          </div>
        </div>

        {/* Wire & Voltmeter */}
        <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[400px] h-32 border-t-4 border-x-4 border-yellow-500/50 rounded-t-full pointer-events-none flex justify-center">
          <div className="bg-obsidian-900 border-4 border-yellow-500 rounded-full w-24 h-24 -mt-12 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            <div className="text-2xl font-mono font-bold text-yellow-400">
              {isRunning ? Math.abs(voltage).toFixed(2) : "OFF"}{" "}
              <span className="text-xs">V</span>
            </div>
          </div>

          {/* Electrons Animation */}
          {isRunning && (
            <div
              className={`absolute top-[-10px] w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_10px_yellow] animate-electron-flow`}
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

      {/* Reaction Summary */}
      <div className="mt-16 bg-obsidian-900/80 p-6 rounded-2xl border border-white/5 max-w-3xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" /> Cel Notatie
          </h3>
          <div className="text-sm font-mono text-slate-400">
            {isRunning
              ? voltage > 0
                ? "Spontane Reactie"
                : "Niet Spontaan (Electrolyse nodig)"
              : "Systeem in rust"}
          </div>
        </div>

        <div className="flex flex-col gap-2 font-mono text-lg">
          {/* Oxidation Half */}
          <div className="flex justify-between p-3 bg-red-500/10 rounded border-l-4 border-red-500">
            <span className="text-red-400 font-bold w-24">Anode (-)</span>
            <span className="text-slate-200">
              {voltage > 0
                ? `${leftCell.metal} → ${leftCell.ion} + ${leftCell.id === "al" ? 3 : 2}e⁻`
                : "..."}
            </span>
            <span className="text-slate-500 w-20 text-right">
              E⁰ = {leftCell.E0}V
            </span>
          </div>

          {/* Reduction Half */}
          <div className="flex justify-between p-3 bg-blue-500/10 rounded border-l-4 border-blue-500">
            <span className="text-blue-400 font-bold w-24">Kathode (+)</span>
            <span className="text-slate-200">
              {voltage > 0
                ? `${rightCell.ion} + ...e⁻ → ${rightCell.metal}`
                : "..."}
            </span>
            <span className="text-slate-500 w-20 text-right">
              E⁰ = {rightCell.E0}V
            </span>
          </div>

          <div className="mt-2 text-right text-xs text-slate-500">
            ΔE = E(kathode) - E(anode) = {Math.abs(voltage).toFixed(2)}V
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`btn-elite-glass !px-8 !py-3 !rounded-xl ${isRunning ? "btn-elite-rose active" : "btn-elite-purple active"}`}
          >
            <Zap size={20} className={isRunning ? "animate-pulse" : ""} />
            {isRunning ? "Verbreek Kring" : "Sluit Kring"}
          </button>
        </div>
      </div>

      <style>{`
                @keyframes electron-right {
                    0% { transform: translateX(0) translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateX(400px) translateY(0); opacity: 0; }
                }
                @keyframes electron-left {
                    0% { transform: translateX(400px) translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateX(0) translateY(0); opacity: 0; }
                }
            `}</style>
    </div>
  );
};
