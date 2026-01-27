/**
 * Vectors Params Component
 */

import {
  useGlobalSettings,
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type { VectorsModuleState } from "@features/math/types";
import { MatrixEditor } from "@features/math/ui/MatrixEditor";
import { useTranslations } from "@shared/hooks/useTranslations";
import { Eye, EyeOff, Settings } from "lucide-react";
import React from "react";

export const VectorsParams: React.FC = () => {
  const { t } = useTranslations();
  const {
    showVectorSettings,
    setShowVectorSettings,
    matrixA,
    setMatrixA,
    matrixB,
    setMatrixB,
  } = useMathLabContext();

  const [state, setState] = useModuleState<VectorsModuleState>("vectors");
  const [globalSettings, setGlobalSettings] = useGlobalSettings();

  const toggleSetting = (key: string) => {
    // Check if it's a global setting (grid, axes, autoRotate)
    if (["showGrid", "showAxes", "autoRotate"].includes(key)) {
      setGlobalSettings((prev) => ({
        ...prev,
        [key]: !prev[key as keyof typeof globalSettings],
      }));
    } else {
      // Assume it's a module setting
      setState((prev) => ({
        ...prev,
        [key]: !prev[key as keyof VectorsModuleState],
      }));
    }
  };

  const getValue = (key: string) => {
    if (["showGrid", "showAxes", "autoRotate"].includes(key)) {
      return globalSettings[key as keyof typeof globalSettings];
    }
    return state[key as keyof VectorsModuleState];
  };

  const visualizations = [
    {
      key: "showGrid",
      label: "Grid",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/50",
      shadow: "shadow-[0_0_15px_rgba(129,140,248,0.2)]",
    },
    {
      key: "showAxes",
      label: "Axes",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/50",
      shadow: "shadow-[0_0_15px_rgba(129,140,248,0.2)]",
    },
    {
      key: "showResultant",
      label: "Resultant (Σ)",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/50",
      shadow: "shadow-[0_0_15px_rgba(192,132,252,0.2)]",
    },
    {
      key: "showCrossProduct",
      label: "Cross Product (×)",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/50",
      shadow: "shadow-[0_0_15px_rgba(251,191,36,0.2)]",
    },
    {
      key: "showDotProduct",
      label: "Dot Product (·)",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/50",
      shadow: "shadow-[0_0_15px_rgba(34,211,238,0.2)]",
    },
    {
      key: "showProjections",
      label: "Projections",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/50",
      shadow: "shadow-[0_0_15px_rgba(244,114,182,0.2)]",
    },
    {
      key: "showPlane",
      label: "Span Plane",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/50",
      shadow: "shadow-[0_0_15px_rgba(52,211,153,0.2)]",
    },
    {
      key: "showAngles",
      label: "Angles",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/50",
      shadow: "shadow-[0_0_15px_rgba(251,113,133,0.2)]",
    },
    {
      key: "showValues",
      label: "Labels",
      color: "text-sky-300",
      bg: "bg-sky-500/10",
      border: "border-sky-500/50",
      shadow: "shadow-[0_0_15px_rgba(125,211,252,0.2)]",
    },
    {
      key: "showPhysics",
      label: "Physics",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/50",
      shadow: "shadow-[0_0_15px_rgba(251,146,60,0.2)]",
    },
    {
      key: "showGhosting",
      label: "Ghosting",
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/50",
      shadow: "shadow-[0_0_15px_rgba(45,212,191,0.2)]",
    },
    {
      key: "traceMode",
      label: "Trace",
      color: "text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/50",
      shadow: "shadow-[0_0_15px_rgba(232,121,249,0.2)]",
    },
  ] as const;

  return (
    <div className="space-y-4 pb-20">
      {/* MATRIX EDITORS */}
      <div className="flex flex-col gap-4 mb-6">
        <MatrixEditor
          label="Matrix A"
          value={matrixA}
          onChange={setMatrixA}
          color="#60a5fa"
        />
        <MatrixEditor
          label="Matrix B"
          value={matrixB}
          onChange={setMatrixB}
          color="#f472b6"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          {t("calculus.vectors.visualization")}
        </span>
        <button
          onClick={() => setShowVectorSettings(!showVectorSettings)}
          className={`p-1.5 rounded transition-all ${
            showVectorSettings
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              : "bg-white/10 text-slate-400 hover:text-white border border-transparent"
          }`}
        >
          <Settings size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {visualizations.map(({ key, label, color, bg, border, shadow }) => {
          const isActive = getValue(key);
          return (
            <button
              key={key}
              onClick={() => toggleSetting(key)}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border ${
                isActive
                  ? `${bg} ${color} ${border} ${shadow}`
                  : "bg-white/5 text-slate-500 hover:bg-white/10 border-transparent"
              }`}
            >
              {isActive ? <Eye size={12} /> : <EyeOff size={12} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Auto Rotate */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={() => toggleSetting("autoRotate")}
          className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
            globalSettings.autoRotate
              ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black"
              : "bg-white/10 text-slate-400 hover:text-white"
          }`}
        >
          {globalSettings.autoRotate ? "Stop Rotation" : "Auto Rotate"}
        </button>
      </div>
    </div>
  );
};
