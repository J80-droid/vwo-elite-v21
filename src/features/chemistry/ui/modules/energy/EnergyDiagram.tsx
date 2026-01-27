import { Activity, Thermometer } from "lucide-react";
import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useModuleState } from "../../../hooks/ChemistryLabContext";
import { ChemistryState } from "../../../types";

const AreaChartAny = AreaChart as unknown as React.ComponentType<Record<string, unknown>>;

export const EnergyStage: React.FC = () => {
  return <EnergyDiagram />;
};

export const EnergyControls: React.FC = () => {
  return <div className="p-4 text-xs text-slate-500 font-mono">ENERGY_CONTROLS // READY</div>;
};

export const EnergyDiagram: React.FC = () => {
  const [state] = useModuleState<ChemistryState>("neutralization");
  const isMounted = typeof window !== "undefined";

  const isExothermic = (state?.deltaH || 0) < 0;

  const chartData = useMemo(() => {
    const data = [];
    const steps = 50;
    const Ea = state?.activationEnergy || 50;
    const dH = state?.deltaH || -20;

    for (let i = 0; i <= steps; i++) {
      const x = i / steps;
      let y = 0;

      if (x < 0.3) {
        y = 30; // Reactants baseline
      } else if (x < 0.5) {
        // Activation curve
        const t = (x - 0.3) / 0.2;
        y = 30 + (Ea - 30) * Math.sin((t * Math.PI) / 2);
      } else if (x < 0.7) {
        // Reaction curve
        const t = (x - 0.5) / 0.2;
        y = Ea - (Ea - (30 + dH)) * Math.sin((t * Math.PI) / 2);
      } else {
        y = 30 + dH; // Products baseline
      }

      data.push({
        x: i,
        energy: Math.max(0, y),
      });
    }
    return data;
  }, [state?.activationEnergy, state?.deltaH]);

  return (
    <div className="p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
            Energie-Diagram
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Thermodynamische analyse van de reactie
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
              Delta H
            </span>
            <span
              className={`text-xl font-black ${isExothermic ? "text-rose-500" : "text-cyan-500"}`}
            >
              {state?.deltaH?.toFixed(1) || "0.0"} kJ/mol
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <Thermometer
              className={isExothermic ? "text-rose-500" : "text-cyan-500"}
              size={24}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        <div className="lg:col-span-2 bg-slate-950/40 rounded-3xl border border-white/5 p-8 relative flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${isExothermic ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"}`}
                />
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  {isExothermic ? "Exotherm" : "Endotherm"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <Activity size={14} /> Reactieweg $\rightarrow$
            </div>
          </div>

          <div
            className="flex-1 w-full min-h-[350px]"
            style={{ minWidth: 300, minHeight: 350 }}
          >
            {isMounted ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={300}
                minHeight={300}
              >
                <AreaChartAny
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient
                      id="energyGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={isExothermic ? "#f43f5e" : "#06b6d4"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={isExothermic ? "#f43f5e" : "#06b6d4"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.03)"
                    vertical={false}
                  />
                  <XAxis dataKey="x" hide />
                  <YAxis hide domain={[0, "auto"]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                              Energie
                            </p>
                            <p className="text-sm font-black text-white">
                              {payload[0]?.value.toFixed(1)} kJ
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="energy"
                    stroke={isExothermic ? "#f43f5e" : "#06b6d4"}
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#energyGradient)"
                    animationDuration={1500}
                  />
                </AreaChartAny>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-white/5 animate-pulse rounded-2xl" />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5">
            <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4">
              Analyse Details
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Activeringsenergie</span>
                <span className="text-sm font-bold text-white">
                  {state?.activationEnergy?.toFixed(0) || "50"} kJ
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Reactie-enthalpie</span>
                <span className="text-sm font-bold text-white">
                  {state?.deltaH?.toFixed(1) || "-20"} kJ
                </span>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] text-slate-500 italic leading-relaxed">
                  {isExothermic
                    ? "De energie van de producten is lager dan die van de reactanten. Er komt netto-energie vrij in de vorm van warmte."
                    : "De energie van de producten is hoger dan die van de reactanten. Er moet netto-energie worden toegevoegd."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
