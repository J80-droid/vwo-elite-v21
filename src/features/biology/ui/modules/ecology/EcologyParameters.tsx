import { Activity, Beaker, Mountain, Zap } from "lucide-react";
import React from "react";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultEcologyState, EcologyState } from "../../../types";

export const EcologyParameters: React.FC = () => {
  const [state] = useModuleState<EcologyState>("ecology", defaultEcologyState);

  const ecosystemStats = [
    {
      label: "Biodiversiteit Index",
      value: "1.42",
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      label: "Energieoverdracht",
      value: `${((state.growthRatePredator * 100) / state.growthRatePrey).toFixed(1)}%`,
      icon: Zap,
      color: "text-amber-400",
    },
    {
      label: "Draagkracht Benutting",
      value: `${((state.preyCount / state.carryingCapacity) * 100).toFixed(1)}%`,
      icon: Mountain,
      color: "text-blue-400",
    },
    {
      label: "Systeem-Stabiliteit",
      value:
        state.predatorCount > 0 && state.preyCount > 0 ? "Stabiel" : "Kritiek",
      icon: Beaker,
      color:
        state.predatorCount > 0 && state.preyCount > 0
          ? "text-purple-400"
          : "text-red-500",
    },
  ];

  return (
    <div className="p-6 grid grid-cols-2 gap-4">
      {ecosystemStats.map((stat, i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-slate-500 uppercase text-[9px] font-black tracking-widest">
            <stat.icon size={12} className={stat.color} />
            {stat.label}
          </div>
          <div className="text-lg font-mono font-bold text-white uppercase tabular-nums">
            {stat.value}
          </div>
        </div>
      ))}

      <div className="col-span-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mt-2">
        <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 italic">
          Ecologische Balans
        </h5>
        <p className="text-[10px] text-slate-400 leading-relaxed font-outfit">
          Bij een draagkracht van{" "}
          <span className="text-white">
            {state.carryingCapacity.toFixed(0)}
          </span>{" "}
          bereikt de prooi-populatie een verzadigingspunt waarbij de groei
          afvlakt (logistieke groei).
        </p>
      </div>
    </div>
  );
};
