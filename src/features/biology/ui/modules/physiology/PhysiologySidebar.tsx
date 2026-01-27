/* eslint-disable @typescript-eslint/no-explicit-any */
import { logActivitySQL } from "@shared/api/sqliteService";
import { useTranslations } from "@shared/hooks/useTranslations";
import {
  Activity,
  Brain,
  Droplets,
  Heart,
  Thermometer,
  Wind,
} from "lucide-react";
import React from "react";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultPhysiologyState, PhysiologyState } from "../../../types";

export const PhysiologySidebar: React.FC = () => {
  const [state, setState] = useModuleState<PhysiologyState>(
    "physiology",
    defaultPhysiologyState,
  );
  const { t } = useTranslations();

  const systems = [
    {
      id: "circulatory",
      labelKey: "biology.physiology.sidebar.circulatory",
      icon: Heart,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      id: "respiratory",
      labelKey: "biology.physiology.sidebar.respiratory",
      icon: Wind,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      id: "nervous",
      labelKey: "biology.physiology.sidebar.nervous",
      icon: Brain,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      id: "endocrine",
      labelKey: "biology.physiology.sidebar.endocrine",
      icon: Droplets,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  const handleSelectSystem = (id: any) => {
    setState((prev) => ({ ...prev, activeSystem: id }));
    logActivitySQL("bio", `System selected: ${id}`, 10);
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
          <Activity size={14} className="text-red-500" />{" "}
          {t("biology.physiology.sidebar.anatomical_systems")}
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {systems.map((sys) => (
            <button
              key={sys.id}
              onClick={() => handleSelectSystem(sys.id)}
              className={`
                                flex items-center gap-4 px-4 py-4 rounded-xl border transition-all
                                ${
                                  state.activeSystem === sys.id
                                    ? `bg-white/10 ${sys.bg} border-white/20 text-white`
                                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                                }
                            `}
            >
              <sys.icon
                size={20}
                className={
                  state.activeSystem === sys.id ? sys.color : "text-slate-500"
                }
              />
              <span className="text-xs font-bold uppercase tracking-widest">
                {t(sys.labelKey)}
              </span>
              {state.activeSystem === sys.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
          <Thermometer size={14} className="text-orange-400" />{" "}
          {t("biology.physiology.sidebar.stress_test")}
        </h3>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between mb-3">
            <span>{t("biology.physiology.sidebar.physical_exertion")}</span>
            <span className="text-white font-mono">{state.heartRate} BPM</span>
          </label>
          <input
            type="range"
            min="40"
            max="200"
            value={state.heartRate ?? 70}
            onChange={(e) =>
              setState((p) => ({ ...p, heartRate: parseInt(e.target.value) }))
            }
            className="w-full accent-red-500"
          />
        </div>
      </div>
    </div>
  );
};
