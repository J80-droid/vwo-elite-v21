import { Gauge } from "lucide-react";
import React from "react";

import { useRelativityEngine } from "./useRelativityEngine";

export const LorentzFactorHUD: React.FC = () => {
  const { beta, gamma } = useRelativityEngine();

  // Calculate percentage for visual bar (gamma 1-10 mapped to 0-100%)
  const gammaPercentage = Math.min(((gamma - 1) / 9) * 100, 100);

  // Velocity as percentage of c
  const velocityPercent = Math.abs(beta) * 100;

  return (
    <div className="p-4 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="w-4 h-4 text-rose-400" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Lorentz Factor
        </span>
      </div>

      {/* Main Display */}
      <div className="flex items-baseline gap-3 mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-mono font-black text-rose-400 tracking-tighter">
            γ =
          </span>
          <span className="text-4xl font-mono font-black text-white tracking-tighter">
            {gamma > 100 ? "∞" : gamma.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase">
          <span>1.000</span>
          <span>γ → ∞</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
            style={{ width: `${gammaPercentage}%` }}
          />
        </div>
      </div>

      {/* Velocity Display */}
      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            Velocity (β)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-white">
              {beta.toFixed(3)}
            </span>
            <span className="text-[10px] text-slate-500">c</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            % Lichtsnelheid
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-amber-400">
              {velocityPercent.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500">%</span>
          </div>
        </div>
      </div>

      {/* Formula */}
      <div className="mt-3 pt-3 border-t border-white/10 text-center">
        <span className="text-[10px] text-slate-500 font-mono">
          γ = 1 / √(1 - β²)
        </span>
      </div>
    </div>
  );
};
