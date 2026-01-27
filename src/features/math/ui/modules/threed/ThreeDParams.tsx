/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ThreeD Params Component
 */

import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type { ThreeDModuleState } from "@features/math/types";
import { useTranslations } from "@shared/hooks/useTranslations";
import { Eye, EyeOff, Pause, Play } from "lucide-react";
import React from "react";

export const ThreeDParams: React.FC = () => {
  const { t } = useTranslations();
  const { isAnimatingLiquid, setIsAnimatingLiquid } = useMathLabContext();

  const [state, setState] = useModuleState<ThreeDModuleState>("3d");

  const toggleSetting = (key: keyof ThreeDModuleState) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visualizations = [
    {
      key: "showGradients",
      label: t("calculus.threed.settings.visualization.gradients"),
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/50",
      shadow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]",
    },
    {
      key: "showContours",
      label: t("calculus.threed.settings.visualization.contours"),
      color: "text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/50",
      shadow: "shadow-[0_0_15px_rgba(232,121,249,0.2)]",
    },
    {
      key: "showLaser",
      label: t("calculus.threed.settings.visualization.laser"),
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/50",
      shadow: "shadow-[0_0_15px_rgba(248,113,113,0.2)]",
    },
    {
      key: "showGlass",
      label: t("calculus.threed.settings.visualization.glass"),
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/50",
      shadow: "shadow-[0_0_15px_rgba(34,211,238,0.2)]",
    },
    {
      key: "showTangent",
      label: t("calculus.threed.settings.visualization.tangent"),
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/50",
      shadow: "shadow-[0_0_15px_rgba(251,191,36,0.2)]",
    },
    {
      key: "showCritical",
      label: t("calculus.threed.settings.visualization.critical_pts"),
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/50",
      shadow: "shadow-[0_0_15px_rgba(251,113,133,0.2)]",
    },
    {
      key: "wireframe",
      label: t("calculus.threed.settings.visualization.wireframe"),
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/50",
      shadow: "shadow-[0_0_15px_rgba(129,140,248,0.2)]",
    },
    {
      key: "showHologram",
      label: t("calculus.threed.settings.visualization.hologram"),
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/50",
      shadow: "shadow-[0_0_15px_rgba(45,212,191,0.2)]",
    },
    {
      key: "showStreamlines",
      label: "Streamlines",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/50",
      shadow: "shadow-[0_0_15px_rgba(96,165,250,0.2)]",
    },
  ] as const;

  return (
    <div className="space-y-4 pb-20">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
        {t("calculus.threed.settings.visualization.title") ||
          t("calculus.threed.settings.visualization")}
      </div>

      {/* Visualization Toggles */}
      <div className="flex flex-wrap gap-2">
        {visualizations.map(({ key, label, color, bg, border, shadow }) => (
          <button
            key={key}
            onClick={() => toggleSetting(key as any)}
            className={`py-1.5 px-3 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-2 border ${
              state[key as keyof ThreeDModuleState]
                ? `${bg} ${color} ${border} ${shadow}`
                : "bg-white/5 text-slate-500 border-transparent hover:bg-white/10 hover:text-slate-300"
            }`}
          >
            {state[key as keyof ThreeDModuleState] ? (
              <Eye size={12} />
            ) : (
              <EyeOff size={12} />
            )}
            {label}
          </button>
        ))}
      </div>

      {/* Animation Toggle */}
      <button
        onClick={() => setIsAnimatingLiquid(!isAnimatingLiquid)}
        className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
          isAnimatingLiquid
            ? "bg-pink-500/10 text-pink-400 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.2)]"
            : "bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10"
        }`}
      >
        {isAnimatingLiquid ? <Pause size={16} /> : <Play size={16} />}
        {isAnimatingLiquid
          ? t("calculus.threed.stop_animation")
          : t("calculus.threed.animate")}
      </button>

      {/* Sliders */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
            {t("calculus.threed.settings.resolution")}
          </label>
          <input
            type="range"
            min={20}
            max={100}
            value={state.surfaceResolution || 50}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                surfaceResolution: Number(e.target.value),
              }))
            }
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-xs text-slate-400">
            {state.surfaceResolution}
          </span>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
            {t("calculus.threed.settings.view_range")}
          </label>
          <input
            type="range"
            min={2}
            max={10}
            value={state.surfaceRange || 5}
            onChange={(e) =>
              setState((s) => ({ ...s, surfaceRange: Number(e.target.value) }))
            }
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-xs text-slate-400">±{state.surfaceRange}</span>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
            {t("calculus.threed.settings.opacity")}
          </label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.1}
            value={state.surfaceOpacity || 1}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                surfaceOpacity: Number(e.target.value),
              }))
            }
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-xs text-slate-400">
            {((state.surfaceOpacity || 1) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};
