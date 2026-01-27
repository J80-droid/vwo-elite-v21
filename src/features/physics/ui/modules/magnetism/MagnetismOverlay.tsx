import { Activity, Radio, Zap } from "lucide-react";
import React from "react";

import { LorentzForceHUD } from "./LorentzForceHUD";
import { useMagnetismEngine } from "./useMagnetismEngine";

export const MagnetismOverlay: React.FC = () => {
  const { state } = useMagnetismEngine();

  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-6">
      {/* Top Center: Equation */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <LorentzForceHUD />
      </div>

      {/* Top Left: Lab Branding & Field Status */}
      <div className="absolute top-6 left-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg leading-none">
            MAGNETISME <span className="text-cyan-400">LAB</span>
          </h2>
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            Lorentz Engine v3.0
          </span>
        </div>

        <div className="p-4 bg-black/10 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl flex flex-col gap-3 w-48 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={12} className="text-cyan-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Status
              </span>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${state.isPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}
            />
          </div>

          <div className="flex flex-col gap-2 border-t border-white/5 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase">
                Cyclotron
              </span>
              <span className="text-[9px] font-mono text-cyan-400 font-bold">
                ACTIVE
              </span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-300"
                style={{ width: state.isPlaying ? "100%" : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Right: Tools Status (Subtle) */}
      <div className="absolute bottom-12 right-6 flex flex-col gap-3 items-end">
        {state.eField !== 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full backdrop-blur-md animate-in slide-in-from-right-10 duration-500">
            <Zap size={14} className="text-fuchsia-400" />
            <span className="text-[10px] font-black text-fuchsia-300 uppercase tracking-widest">
              Elektrisch Veld Actief
            </span>
          </div>
        )}
        {state.bField !== 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full backdrop-blur-md animate-in slide-in-from-right-10 duration-500 delay-75">
            <Activity size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">
              Magnetisch Veld Actief
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
