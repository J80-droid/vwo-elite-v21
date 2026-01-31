import { Beaker } from "lucide-react";
import React, { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useModuleState } from "../../../hooks/ChemistryLabContext";
import { ChemistryState, defaultChemistryState } from "../../../types";

const LineChartAny = LineChart as unknown as React.ComponentType<Record<string, unknown>>;

export const PHStage: React.FC = () => {
  return <PHReactor />;
};

export const PHControls: React.FC = () => {
  const [state, setState] = useModuleState<ChemistryState>("neutralization", {
    ...defaultChemistryState,
    ph: 7,
    phHistory: [7],
  });

  const adjustPH = (delta: number) => {
    const newPH = Math.max(0, Math.min(14, (state?.ph || 7) + delta));
    const newHistory = [...(state?.phHistory || [7]), newPH].slice(-50);
    setState({ ph: newPH, phHistory: newHistory });
  };

  return (
    <div className="flex flex-row items-center gap-4">
      <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl items-center gap-1">
        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest px-2">Zuur (+)</span>
        <div className="flex gap-0.5">
          {[0.1, 0.5, 1.0].map((val) => (
            <button
              key={`acid-${val}`}
              onClick={() => adjustPH(-val)}
              className="px-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-black hover:bg-rose-500/20 transition-all border border-rose-500/10"
            >
              -{val}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-white/10 mx-1" />

      <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl items-center gap-1">
        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest px-2">Base (-)</span>
        <div className="flex gap-0.5">
          {[0.1, 0.5, 1.0].map((val) => (
            <button
              key={`base-${val}`}
              onClick={() => adjustPH(val)}
              className="px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-black hover:bg-blue-500/20 transition-all border border-blue-500/10"
            >
              +{val}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setState({ ph: 7, phHistory: [7] })}
        className="ml-4 px-3 py-1.5 rounded-lg bg-white/5 text-slate-500 text-[10px] font-black uppercase hover:text-white transition-colors"
      >
        Reset
      </button>

      {state?.ph !== undefined && (
        <div className="ml-auto flex items-center gap-3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Measured</span>
            <span className={`text-[12px] font-black leading-tight ${state.ph < 7 ? 'text-rose-400' : state.ph > 7 ? 'text-blue-400' : 'text-emerald-400'}`}>
              pH {state.ph.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const PHReactor: React.FC = () => {
  const [state] = useModuleState<ChemistryState>("neutralization");
  const isMounted = typeof window !== "undefined";

  const chartData = useMemo(() => {
    const history = state?.phHistory || [];
    if (history.length > 0) {
      return history.map((val, i) => ({ time: i, ph: val }));
    }
    return Array.from({ length: 20 }, (_, i) => ({ time: i, ph: 7 + Math.sin(i / 2) * 0.01 }));
  }, [state?.phHistory]);

  const phColor = useMemo(() => {
    const ph = state?.ph || 7;
    if (ph < 3) return "text-red-500";
    if (ph < 6) return "text-orange-400";
    if (ph < 8) return "text-emerald-400";
    if (ph < 11) return "text-blue-400";
    return "text-purple-500";
  }, [state?.ph]);

  return (
    <div className="h-full w-full flex flex-col p-8 relative overflow-hidden bg-black">
      {/* Background Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none z-0">
        <h1 className="text-[12rem] font-black tracking-tighter text-white">
          pH ENGINE
        </h1>
      </div>

      <div className="relative z-10 flex flex-col h-full gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Beaker className={phColor} size={36} /> pH-Reactor
            </h2>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">
              Automated Titration Monitor
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[2rem] px-8 py-4 backdrop-blur-xl">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mb-1">Actuele Waarde</span>
            <span className={`text-4xl font-mono font-black ${phColor}`}>
              {state?.ph?.toFixed(2) || "7.00"}
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-slate-950/40 rounded-[2.5rem] border border-white/5 p-8 relative group overflow-hidden">
          <div className="absolute top-6 left-8 flex items-center gap-4 z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse" />
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                Real-time Feedback Curve
              </span>
            </div>
          </div>

          <div className="w-full h-full min-h-[300px] pt-8">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <LineChartAny data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 14]} stroke="#475569" fontSize={10} tickFormatter={(val) => `${val}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">pH Level</p>
                            <p className="text-sm font-black text-white">{payload[0]?.value.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ph"
                    stroke="#06b6d4"
                    strokeWidth={4}
                    dot={false}
                    animationDuration={300}
                    isAnimationActive={false}
                  />
                </LineChartAny>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-white/5 animate-pulse rounded-2xl" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
