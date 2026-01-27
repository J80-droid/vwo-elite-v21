import React from "react";

import { useMagnetismEngine } from "./useMagnetismEngine";

export const LorentzForceHUD: React.FC = () => {
  const { state } = useMagnetismEngine();

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-black/20 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl pointer-events-auto group hover:bg-black/30 transition-all duration-500">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Lorentzkracht Vergelijking
        </span>
      </div>

      <div className="flex items-baseline gap-2 py-1">
        <span className="text-2xl font-serif italic text-white/90">
          F = q(E + v × B)
        </span>
      </div>

      <div className="flex gap-4 border-t border-white/5 pt-2 mt-1">
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-bold text-slate-500 uppercase">
            B-Veld
          </span>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {state.bField.toFixed(2)} T
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-bold text-slate-500 uppercase">
            E-Veld
          </span>
          <span className="text-xs font-mono font-bold text-fuchsia-400">
            {state.eField.toFixed(0)} V/m
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-bold text-slate-500 uppercase">
            Deeltjes
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {state.particles.length}
          </span>
        </div>
      </div>
    </div>
  );
};
