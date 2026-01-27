import { useTranslations } from "@shared/hooks/useTranslations";
import { Zap } from "lucide-react";
import React from "react";

import { useSpringEngine } from "./useSpringEngine";

export const SpringParameters: React.FC = () => {
  const { state, setParam } = useSpringEngine();
  const { t } = useTranslations();

  return (
    <div className="bg-black/40 backdrop-blur-xl p-5 rounded-3xl border border-white/10 space-y-5 shadow-2xl min-w-[260px] animate-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-3 pb-2 border-b border-white/5">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <Zap className="text-cyan-400" size={14} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
            {t("physics.layout.parameters")}
          </h4>
          <div className="text-[9px] text-cyan-400 font-mono">
            {t("physics.modules.spring")}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <ParameterSlider
          label={t("physics.spring.mass")}
          value={state.mass}
          min={0.1}
          max={5.0}
          step={0.1}
          unit="kg"
          color="cyan"
          onChange={(val) => setParam("mass", val)}
          t={t}
        />
        <ParameterSlider
          label={t("physics.spring.spring_constant")}
          value={state.k}
          min={1.0}
          max={50.0}
          step={1.0}
          unit="N/m"
          color="amber"
          onChange={(val) => setParam("k", val)}
          t={t}
        />
        <ParameterSlider
          label={t("physics.spring.damping")}
          value={state.damping}
          min={0.0}
          max={2.0}
          step={0.05}
          unit=""
          color="rose"
          onChange={(val) => setParam("damping", val)}
          t={t}
        />
      </div>
    </div>
  );
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  color: "cyan" | "amber" | "rose";
  onChange: (val: number) => void;
  t: (key: string) => string;
}

const ParameterSlider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  color,
  onChange,
  t,
}) => {
  const accentColor = {
    cyan: "accent-cyan-400 group-hover:text-cyan-300",
    amber: "accent-amber-400 group-hover:text-amber-300",
    rose: "accent-rose-400 group-hover:text-rose-300",
  }[color];

  return (
    <div className="group">
      <div
        className={`flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-2 transition-colors ${accentColor.split(" ")[1]}`}
      >
        <span>{label}</span>
        <span className="font-mono text-white">
          {value.toFixed(label === t("physics.spring.damping") ? 2 : 1)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer ${accentColor.split(" ")[0]}`}
      />
    </div>
  );
};
