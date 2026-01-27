import { Activity, Beaker, Wind } from "lucide-react";
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
import { ChemistryState } from "../../../types";

const LineChartAny = LineChart as unknown as React.ComponentType<Record<string, unknown>>;

export const PHStage: React.FC = () => {
  return <PHReactor />;
};

export const PHControls: React.FC = () => {
  return <div className="p-4 text-xs text-slate-500 font-mono">PH_CONTROLS // READY</div>;
};

export const PHReactor: React.FC = () => {
  const [state] = useModuleState<ChemistryState>("neutralization");
  const isMounted = typeof window !== "undefined";

  const chartData = useMemo(() => {
    const data = [];
    const ph = state?.ph || 7;
    const history = state?.phHistory || [];

    // Use history if available, otherwise fake it for visualization
    if (history.length > 0) {
      return history.map((val, i) => ({ time: i, ph: val }));
    }

    // Fallback simulation
    for (let i = 0; i < 20; i++) {
      data.push({ time: i, ph: ph + Math.sin(i / 2) * 0.1 });
    }
    return data;
  }, [state?.ph, state?.phHistory]);

  const phColor = useMemo(() => {
    const ph = state?.ph || 7;
    if (ph < 3) return "text-red-500";
    if (ph < 6) return "text-orange-400";
    if (ph < 8) return "text-emerald-400";
    if (ph < 11) return "text-blue-400";
    return "text-purple-500";
  }, [state?.ph]);

  return (
    <div className="p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
            pH-Reactor
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Real-time monitoring van de zuurgraad
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-mono">
              Live Reading
            </span>
            <span className={`text-3xl font-black font-mono ${phColor}`}>
              {state?.ph?.toFixed(2) || "7.00"}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <Beaker className={phColor} size={28} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 relative z-10">
        <div className="lg:col-span-2 bg-slate-950/40 rounded-3xl border border-white/5 p-8 relative group">
          <div className="absolute top-6 left-8 flex items-center gap-4 z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                Titratiecurve (pH)
              </span>
            </div>
          </div>

          <div
            className="w-full h-full min-h-[400px]"
            style={{ minWidth: 300, minHeight: 400 }}
          >
            {isMounted ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={300}
                minHeight={300}
              >
                <LineChartAny
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.03)"
                    vertical={false}
                  />
                  <XAxis dataKey="time" hide />
                  <YAxis
                    domain={[0, 14]}
                    stroke="#475569"
                    fontSize={10}
                    tickFormatter={(val) => `pH ${val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                              Acidity
                            </p>
                            <p className="text-sm font-black text-white">
                              pH {payload[0]?.value.toFixed(2)}
                            </p>
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
                    strokeWidth={3}
                    dot={false}
                    animationDuration={1000}
                  />
                </LineChartAny>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-white/5 animate-pulse rounded-2xl" />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-6">
            <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
              Reactor Status
            </h4>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
              <div className="flex items-center gap-3">
                <Wind className="text-cyan-400" size={16} />
                <span className="text-xs text-slate-400">Roeren</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase">Actief</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 opacity-50">
              <div className="flex items-center gap-3">
                <Activity className="text-slate-400" size={16} />
                <span className="text-xs text-slate-400">Temperatuursensor</span>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">Standby</span>
            </div>
            <div className="pt-2 text-center">
              <div className="inline-block py-1 px-3 rounded-full bg-obsidian-900 border border-white/5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Elite Lab Monitoring v4.2
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
