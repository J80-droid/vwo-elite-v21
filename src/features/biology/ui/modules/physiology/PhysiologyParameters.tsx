import { useTranslations } from "@shared/hooks/useTranslations";
import {
  Activity,
  Droplets,
  Heart,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import React, { useMemo } from "react";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultPhysiologyState, PhysiologyState } from "../../../types";
import {
  calculateCardiacOutput,
  calculateMAP,
  CARDIOVASCULAR,
  estimateStrokeVolume,
  RESPIRATORY,
} from "../../../utils/bioConstants";

export const PhysiologyParameters: React.FC = () => {
  const [state] = useModuleState<PhysiologyState>(
    "physiology",
    defaultPhysiologyState,
  );
  const { t } = useTranslations();

  // Real physiological calculations
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

  // Estimated respiratory rate based on heart rate (physiological correlation)
  const respiratoryRate = useMemo(() => {
    // Normal ratio is ~4:1 (HR:RR) at rest
    const baseRR = 15;
    const hrDeviation = (state.heartRate - 70) / 70;
    return Math.round(baseRR + hrDeviation * 8);
  }, [state.heartRate]);

  // Oxygen saturation (remains stable unless extreme conditions)
  const o2Sat = useMemo(() => {
    if (state.heartRate > 180) return 94;
    if (state.heartRate > 150) return 96;
    return 98;
  }, [state.heartRate]);

  const vitalSigns = [
    {
      label: t("biology.physiology.parameters.blood_pressure_syst"),
      value: `${state.bloodPressure?.systolic ?? 120}`,
      unit: "mmHg",
      icon: Activity,
      color: "text-red-500",
      normal: `${CARDIOVASCULAR.BLOOD_PRESSURE_SYSTOLIC.min}-${CARDIOVASCULAR.BLOOD_PRESSURE_SYSTOLIC.max}`,
    },
    {
      label: t("biology.physiology.parameters.blood_pressure_diast"),
      value: `${state.bloodPressure?.diastolic ?? 80}`,
      unit: "mmHg",
      icon: Droplets,
      color: "text-blue-500",
      normal: `${CARDIOVASCULAR.BLOOD_PRESSURE_DIASTOLIC.min}-${CARDIOVASCULAR.BLOOD_PRESSURE_DIASTOLIC.max}`,
    },
    {
      label: "SpO₂",
      value: `${o2Sat}`,
      unit: "%",
      icon: Zap,
      color: "text-emerald-400",
      normal: `${RESPIRATORY.OXYGEN_SATURATION.min}-${RESPIRATORY.OXYGEN_SATURATION.max}`,
    },
    {
      label: t("biology.physiology.parameters.cardiac_output"),
      value: cardiacOutput.toFixed(1),
      unit: "L/min",
      icon: Heart,
      color: "text-fuchsia-400",
      normal: `${CARDIOVASCULAR.CARDIAC_OUTPUT.min}-${CARDIOVASCULAR.CARDIAC_OUTPUT.max}`,
    },
    {
      label: t("biology.physiology.parameters.stroke_volume"),
      value: strokeVolume.toFixed(0),
      unit: "mL",
      icon: Heart,
      color: "text-pink-400",
      normal: `${CARDIOVASCULAR.STROKE_VOLUME.min}-${CARDIOVASCULAR.STROKE_VOLUME.max}`,
    },
    {
      label: t("biology.physiology.parameters.respiratory_rate"),
      value: `${respiratoryRate}`,
      unit: "/min",
      icon: Wind,
      color: "text-cyan-400",
      normal: `${RESPIRATORY.RESPIRATORY_RATE.min}-${RESPIRATORY.RESPIRATORY_RATE.max}`,
    },
  ];

  // Determine homeostasis status
  const getHomeostasisStatus = () => {
    if (state.heartRate >= 60 && state.heartRate <= 100) {
      return {
        status: t("biology.physiology.parameters.optimal"),
        color: "text-emerald-400",
        bg: "bg-emerald-500/5 border-emerald-500/10",
      };
    } else if (state.heartRate > 100 && state.heartRate <= 150) {
      return {
        status: t("biology.physiology.parameters.elevated"),
        color: "text-amber-400",
        bg: "bg-amber-500/5 border-amber-500/10",
      };
    } else if (state.heartRate > 150) {
      return {
        status: t("biology.physiology.parameters.high_stress"),
        color: "text-red-400",
        bg: "bg-red-500/5 border-red-500/10",
      };
    } else {
      return {
        status: t("biology.physiology.parameters.bradycardia"),
        color: "text-blue-400",
        bg: "bg-blue-500/5 border-blue-500/10",
      };
    }
  };

  const homeostasis = getHomeostasisStatus();

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {vitalSigns.map((sign, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1"
          >
            <div className="flex items-center gap-2 text-slate-500 uppercase text-[8px] font-black tracking-widest">
              <sign.icon size={10} className={sign.color} />
              {sign.label}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-mono font-bold text-white tabular-nums">
                {sign.value}
              </span>
              <span className="text-[9px] text-slate-600">{sign.unit}</span>
            </div>
            <div className="text-[7px] text-slate-700">
              {t("biology.physiology.parameters.normal")}: {sign.normal}{" "}
              {sign.unit}
            </div>
          </div>
        ))}
      </div>

      {/* MAP Display */}
      <div className="bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer size={14} className="text-purple-400" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {t("biology.physiology.parameters.map")}
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-white">
            {map.toFixed(0)}{" "}
            <span className="text-[9px] text-slate-500">mmHg</span>
          </div>
        </div>
        <p className="text-[8px] text-slate-600 mt-1">
          Formula: DBP + ⅓(SBP - DBP) | Normal: 70-105 mmHg
        </p>
      </div>

      {/* Homeostasis Status */}
      <div className={`${homeostasis.bg} border rounded-xl p-3`}>
        <h5
          className={`text-[10px] font-black ${homeostasis.color} uppercase tracking-widest mb-2`}
        >
          {t("biology.physiology.parameters.homeostasis")}: {homeostasis.status}
        </h5>
        <p className="text-[9px] text-slate-400 leading-relaxed">
          At <span className="text-white font-mono">{state.heartRate} BPM</span>
          , cardiac output is{" "}
          <span className="text-white font-mono">
            {cardiacOutput.toFixed(1)} L/min
          </span>
          .
          {state.heartRate > 100 &&
            " The body is compensating with increased respiratory rate."}
          {state.heartRate <= 60 &&
            " Parasympathetic dominance indicates rest state."}
        </p>
      </div>
    </div>
  );
};
