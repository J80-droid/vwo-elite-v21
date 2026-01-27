import { Info, Microscope, Settings2, Zap } from "lucide-react";
import React from "react";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultMicroscopyState, MicroscopyState } from "../../../types";

export const MicroscopyParameters: React.FC = () => {
  const [state] = useModuleState<MicroscopyState>(
    "microscopy",
    defaultMicroscopyState,
  );

  const opticalStats = [
    {
      label: "Resolutie",
      value: `${(200 / (state.zoom / 40)).toFixed(1)} nm`,
      icon: Zap,
      color: "text-blue-400",
    },
    {
      label: "Numerieke Apertuur",
      value: state.zoom >= 400 ? "0.65" : "0.25",
      icon: Microscope,
      color: "text-amber-400",
    },
    {
      label: "Focus Diepte",
      value: `${(50 / state.zoom).toFixed(2)} μm`,
      icon: Settings2,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 gap-2">
        {opticalStats.map((stat, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <stat.icon size={14} className={stat.color} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {stat.label}
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-white uppercase italic tracking-tighter">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Info size={12} /> Optical System Status
        </h5>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">Lens Systeem</span>
            <span className="text-slate-300 font-bold uppercase">
              {state.zoom > 100 ? "Achromatic Oil" : "Achromatic Dry"}
            </span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">Lichtbron</span>
            <span className="text-slate-300 font-bold uppercase">
              LED White (Variable)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
