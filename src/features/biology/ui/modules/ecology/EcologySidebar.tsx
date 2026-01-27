import { logActivitySQL } from "@shared/api/sqliteService";
import { useTranslations } from "@shared/hooks/useTranslations";
import { Globe, Maximize2, Skull, TrendingUp, Zap } from "lucide-react";
import React from "react";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultEcologyState, EcologyState } from "../../../types";

export const EcologySidebar: React.FC = () => {
  const [state, setState] = useModuleState<EcologyState>(
    "ecology",
    defaultEcologyState,
  );
  const { t } = useTranslations();

  const controls = [
    {
      id: "growthRatePrey",
      labelKey: "biology.ecology.sidebar.growth_rate_prey",
      icon: TrendingUp,
      color: "text-emerald-400",
      min: 0.01,
      max: 0.5,
      step: 0.01,
    },
    {
      id: "consumptionRate",
      labelKey: "biology.ecology.sidebar.consumption_rate",
      icon: Zap,
      color: "text-amber-400",
      min: 0.001,
      max: 0.05,
      step: 0.001,
    },
    {
      id: "growthRatePredator",
      labelKey: "biology.ecology.sidebar.efficiency_predator",
      icon: TrendingUp,
      color: "text-blue-400",
      min: 0.001,
      max: 0.1,
      step: 0.001,
    },
    {
      id: "mortalityRatePredator",
      labelKey: "biology.ecology.sidebar.mortality_predator",
      icon: Skull,
      color: "text-red-400",
      min: 0.01,
      max: 0.3,
      step: 0.01,
    },
    {
      id: "carryingCapacity",
      labelKey: "biology.ecology.sidebar.carrying_capacity",
      icon: Maximize2,
      color: "text-purple-400",
      min: 50,
      max: 500,
      step: 10,
    },
  ];

  const resetSim = () => {
    setState((p) => ({
      ...p,
      preyCount: 50,
      predatorCount: 10,
    }));
    logActivitySQL("bio", "Ecosystem reset", 5);
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
          <Globe size={14} className="text-emerald-400" />{" "}
          {t("biology.ecology.sidebar.environment_vars")}
        </h3>
        <div className="space-y-6">
          {controls.map((ctrl) => (
            <div key={ctrl.id}>
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between mb-3">
                <span className="flex items-center gap-2">
                  <ctrl.icon size={12} className={ctrl.color} />{" "}
                  {t(ctrl.labelKey)}
                </span>
                <span className="text-white font-mono">
                  {(state[ctrl.id as keyof EcologyState] as number).toFixed(3)}
                </span>
              </label>
              <input
                type="range"
                min={ctrl.min}
                max={ctrl.max}
                step={ctrl.step}
                value={state[ctrl.id as keyof EcologyState] as number}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    [ctrl.id]: parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-emerald-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={resetSim}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all"
        >
          {t("biology.ecology.sidebar.reset_population")}
        </button>
        <button
          onClick={() => {
            setState((p) => ({ ...p, preyCount: p.preyCount + 50 }));
            logActivitySQL("bio", "Added invasive species (Prey)", 15);
          }}
          className="bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl border border-white/10 transition-all"
        >
          {t("biology.ecology.sidebar.add_prey")}
        </button>
      </div>
    </div>
  );
};
