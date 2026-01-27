import { useTranslations } from "@shared/hooks/useTranslations";
import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultPhysiologyState, PhysiologyState } from "../../../types";
import {
  calculateANSBalance,
  calculateCardiacOutput,
  calculateMAP,
  estimateStrokeVolume,
  generateECGPoint,
} from "../../../utils/bioConstants";

export const PhysiologyAnalysis: React.FC = () => {
  const [state] = useModuleState<PhysiologyState>(
    "physiology",
    defaultPhysiologyState,
  );
  const { t } = useTranslations();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate real PQRST ECG waveform using McSharry model
  const ecgData = useMemo(() => {
    const points = [];
    const duration = 3; // Show 3 seconds of ECG
    const sampleRate = 100; // 100 samples per second

    for (let i = 0; i < duration * sampleRate; i++) {
      const time = i / sampleRate;
      const voltage = generateECGPoint(time, state.heartRate);
      points.push({ time: i, voltage });
    }
    return points;
  }, [state.heartRate]);

  // Calculate real physiological values
  const strokeVolume = useMemo(
    () => estimateStrokeVolume(state.heartRate),
    [state.heartRate],
  );
  const cardiacOutput = useMemo(
    () => calculateCardiacOutput(state.heartRate, strokeVolume),
    [state.heartRate, strokeVolume],
  );
  const map = useMemo(
    () =>
      calculateMAP(
        state.bloodPressure?.systolic ?? 120,
        state.bloodPressure?.diastolic ?? 80,
      ),
    [state.bloodPressure],
  );
  const ansBalance = useMemo(
    () => calculateANSBalance(state.heartRate),
    [state.heartRate],
  );

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between">
        <span>{t("biology.physiology.analysis.ecg_monitor")}</span>
        <span className="text-red-500 animate-pulse font-mono">
          {state.heartRate} BPM
        </span>
      </h5>

      <div className="h-40 min-h-[160px] bg-black/40 border border-white/5 rounded-xl p-2">
        {isMounted ? (
          <ResponsiveContainer
            width="99%"
            height="100%"
            minWidth={10}
            minHeight={160}
          >
            <AreaChart data={ecgData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[-0.5, 1.2]} />
              <Area
                type="monotone"
                dataKey="voltage"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.1}
                isAnimationActive={false}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-white/5 rounded-lg animate-pulse" />
        )}
      </div>

      {/* Real Cardiovascular Parameters */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="bg-black/30 border border-white/5 rounded-lg p-2 text-center">
          <div className="text-[8px] font-bold text-slate-600 uppercase">
            {t("biology.physiology.parameters.cardiac_output")}
          </div>
          <div className="text-sm font-mono font-bold text-white">
            {cardiacOutput.toFixed(1)}{" "}
            <span className="text-[8px] text-slate-500">L/min</span>
          </div>
        </div>
        <div className="bg-black/30 border border-white/5 rounded-lg p-2 text-center">
          <div className="text-[8px] font-bold text-slate-600 uppercase">
            {t("biology.physiology.parameters.stroke_volume")}
          </div>
          <div className="text-sm font-mono font-bold text-white">
            {strokeVolume.toFixed(0)}{" "}
            <span className="text-[8px] text-slate-500">mL</span>
          </div>
        </div>
        <div className="bg-black/30 border border-white/5 rounded-lg p-2 text-center">
          <div className="text-[8px] font-bold text-slate-600 uppercase">
            MAP
          </div>
          <div className="text-sm font-mono font-bold text-white">
            {map.toFixed(0)}{" "}
            <span className="text-[8px] text-slate-500">mmHg</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 bg-black/30 border border-white/5 rounded-xl p-4 overflow-hidden flex flex-col">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          {t("biology.physiology.analysis.system_analysis")}
        </h5>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">
              {t("biology.physiology.analysis.sympathetic")}
            </span>
            <span className="text-orange-400 font-mono text-[9px] w-10 text-right">
              {ansBalance.sympathetic.toFixed(0)}%
            </span>
            <div className="flex-1 mx-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-300"
                style={{ width: `${ansBalance.sympathetic}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">
              {t("biology.physiology.analysis.parasympathetic")}
            </span>
            <span className="text-blue-400 font-mono text-[9px] w-10 text-right">
              {ansBalance.parasympathetic.toFixed(0)}%
            </span>
            <div className="flex-1 mx-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                style={{ width: `${ansBalance.parasympathetic}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
