import { Minimize2 } from "lucide-react";
import React, { useState } from "react";

import { lengthContraction, useRelativityEngine } from "./useRelativityEngine";

export const LengthContractionHUD: React.FC = () => {
  const { gamma } = useRelativityEngine();
  const [restLength, setRestLength] = useState(10); // Default 10 light-seconds

  const contractedLength = lengthContraction(restLength, gamma);
  const contractionPercent = ((1 - 1 / gamma) * 100).toFixed(1);

  return (
    <div className="p-4 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Minimize2 className="w-4 h-4 text-cyan-400" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Lengtecontractie
        </span>
      </div>

      {/* Rest Length Input */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-slate-500 font-bold uppercase">
            Rustlengte (L₀)
          </span>
          <span className="text-[10px] font-mono text-white">
            {restLength.toFixed(1)} ls
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={0.5}
          value={restLength}
          onChange={(e) => setRestLength(parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      {/* Visual Comparison */}
      <div className="space-y-2 mb-4">
        {/* Rest Length Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-400 w-8">L₀</span>
          <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Contracted Length Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-cyan-400 w-8">L'</span>
          <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
              style={{ width: `${(contractedLength / restLength) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Values Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col p-2 bg-white/5 rounded-lg">
          <span className="text-[8px] text-slate-500 uppercase font-bold">
            Gecontracteerd
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-rose-400">
              {contractedLength.toFixed(2)}
            </span>
            <span className="text-[9px] text-slate-500">ls</span>
          </div>
        </div>
        <div className="flex flex-col p-2 bg-white/5 rounded-lg">
          <span className="text-[8px] text-slate-500 uppercase font-bold">
            Contractie
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-amber-400">
              {contractionPercent}
            </span>
            <span className="text-[9px] text-slate-500">%</span>
          </div>
        </div>
      </div>

      {/* Formula */}
      <div className="pt-3 border-t border-white/10 text-center">
        <span className="text-[10px] text-slate-500 font-mono">
          L' = L₀ / γ = L₀ × √(1 - β²)
        </span>
      </div>
    </div>
  );
};
