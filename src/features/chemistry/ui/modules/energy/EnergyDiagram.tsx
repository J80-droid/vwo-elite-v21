import { Thermometer } from "lucide-react";
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
import { ChemistryState, defaultChemistryState } from "../../../types";

const AreaChartAny = AreaChart as unknown as React.ComponentType<Record<string, unknown>>;

export const EnergyStage: React.FC = () => {
  return <EnergyDiagram />;
};

export const EnergyControls: React.FC = () => {
  const [state, setState] = useModuleState<ChemistryState>("neutralization", {
    ...defaultChemistryState,
    activationEnergy: 50,
    deltaH: -20,
  });

  return (
    <div className="flex flex-row items-center gap-6">
      {/* Activation Energy Slider */}
      <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-1 rounded-xl px-3">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ea</span>
        <input
          type="range"
          min="10"
          max="100"
          value={state?.activationEnergy || 50}
          onChange={(e) => setState({ activationEnergy: parseInt(e.target.value) })}
          className="w-32 accent-rose-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-[10px] font-bold text-rose-400 w-8">{state?.activationEnergy || 50}</span>
      </div>

      {/* Delta H Slider */}
      <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-1 rounded-xl px-3">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ΔH</span>
        <input
          type="range"
          min="-50"
          max="50"
          value={state?.deltaH || -20}
          onChange={(e) => setState({ deltaH: parseInt(e.target.value) })}
          className="w-32 accent-cyan-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
        <span className={`text-[10px] font-bold w-8 ${(state?.deltaH || 0) < 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
          {state?.deltaH || -20}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Status</span>
          <span className={`text-[10px] font-black uppercase leading-tight ${(state?.deltaH || 0) < 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
            {(state?.deltaH || 0) < 0 ? 'Exotherm' : 'Endotherm'}
          </span>
        </div>
      </div>
    </div>
  );
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
    <div className="h-full w-full flex flex-col p-8 relative overflow-hidden bg-black">
      {/* Background Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none z-0">
        <h1 className="text-[12rem] font-black tracking-tighter text-white">
          ENERGY
        </h1>
      </div>

      <div className="relative z-10 flex flex-col h-full gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Thermometer size={36} className={isExothermic ? "text-rose-500" : "text-cyan-500"} /> Energie-Diagram
            </h2>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">
              Thermodynamic Pathway Analysis
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[2rem] px-8 py-4 backdrop-blur-xl flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mb-1">ΔH (Enthalpie)</span>
              <span className={`text-3xl font-mono font-black ${isExothermic ? "text-rose-500" : "text-cyan-500"}`}>
                {state?.deltaH?.toFixed(1) || "-20.0"} <span className="text-xs">kJ/mol</span>
              </span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mb-1">Eₐ (Activering)</span>
              <span className="text-3xl font-mono font-black text-white">
                {state?.activationEnergy?.toFixed(0) || "50"} <span className="text-xs text-slate-500">kJ</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-slate-950/40 rounded-[2.5rem] border border-white/5 p-8 relative group overflow-hidden">
          <div className="absolute top-6 left-8 flex items-center gap-4 z-10">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isExothermic ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"} animate-pulse`} />
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                Reaction Coordinate Pathway
              </span>
            </div>
          </div>

          <div className="w-full h-full min-h-[300px] pt-8">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <AreaChartAny data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isExothermic ? "#f43f5e" : "#06b6d4"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isExothermic ? "#f43f5e" : "#06b6d4"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="x" hide />
                  <YAxis hide domain={[0, "auto"]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Energie</p>
                            <p className="text-sm font-black text-white">{payload[0]?.value.toFixed(1)} kJ</p>
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
                    strokeWidth={5}
                    fillOpacity={1}
                    fill="url(#energyGradient)"
                    animationDuration={1500}
                    isAnimationActive={false}
                  />
                </AreaChartAny>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-white/5 animate-pulse rounded-2xl" />
            )}
          </div>

          {/* Labels on chart */}
          <div className="absolute top-1/2 left-10 -translate-y-1/2 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-700">
            <div className="text-[8rem] font-black text-white font-mono select-none">
              E = mc²
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
