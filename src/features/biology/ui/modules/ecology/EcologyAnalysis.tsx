/* eslint-disable react-hooks/exhaustive-deps */
import { useTranslations } from "@shared/hooks/useTranslations";
import React, { useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultEcologyState, EcologyState } from "../../../types";

export const EcologyAnalysis: React.FC = () => {
  const [state] = useModuleState<EcologyState>("ecology", defaultEcologyState);
  const { t } = useTranslations();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  const phasePortraitData = useMemo(() => {
    const points = [];
    const x_base = state.preyCount;
    const y_base = state.predatorCount;

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      points.push({
        x: x_base + Math.cos(angle) * (x_base * 0.2),
        y: y_base + Math.sin(angle) * (y_base * 0.2),
      });
    }
    return points;
  }, [Math.floor(state.preyCount / 5), Math.floor(state.predatorCount / 2)]);

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="flex-1 mb-6">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
          {t("biology.ecology.analysis.phase_portrait")}
        </h5>
        <div className="h-40 min-h-[160px] bg-black/40 border border-white/5 rounded-xl p-2">
          {isMounted ? (
            <ResponsiveContainer
              width="99%"
              height="100%"
              minWidth={10}
              minHeight={160}
            >
              <LineChart data={phasePortraitData}>
                <XAxis dataKey="x" hide />
                <YAxis hide type="number" domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    border: "1px solid #333",
                    fontSize: "10px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-white/5 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      <div className="flex-1 bg-black/30 border border-white/5 rounded-xl p-4 overflow-hidden flex flex-col">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          {t("biology.ecology.analysis.system_energy")}
        </h5>
        <div className="flex-1 flex items-end justify-center">
          <div className="text-3xl font-black text-emerald-500 font-mono italic">
            {(state.preyCount * 1.2 + state.predatorCount * 5.4).toFixed(0)}{" "}
            <span className="text-xs non-italic text-slate-600">kCal/m²</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="flex-1 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{
                width: `${(state.preyCount / (state.preyCount + state.predatorCount)) * 100}%`,
              }}
            />
          </div>
          <div className="flex-1 h-1 bg-red-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500"
              style={{
                width: `${(state.predatorCount / (state.preyCount + state.predatorCount)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
