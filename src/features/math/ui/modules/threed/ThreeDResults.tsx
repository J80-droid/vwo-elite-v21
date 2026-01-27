/**
 * ThreeD Results Component
 */

import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type { ThreeDModuleState } from "@features/math/types";
import { useTranslations } from "@shared/hooks/useTranslations";
import { ColorPicker } from "@shared/ui/ColorPicker";
import { Palette } from "lucide-react";
import React from "react";

const COLOR_MODES = [
  {
    id: "height",
    color: "text-amber-400",
    activeClass:
      "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
  },
  {
    id: "gaussian",
    color: "text-emerald-400",
    activeClass:
      "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.2)]",
  },
  {
    id: "mean",
    color: "text-blue-400",
    activeClass:
      "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(96,165,250,0.2)]",
  },
] as const;

export const ThreeDResults: React.FC = () => {
  const { t } = useTranslations();
  const { rawFunctions } = useMathLabContext();

  const [state, setState] = useModuleState<ThreeDModuleState>("3d");

  const expression = rawFunctions[0] || "sin(sqrt(x^2 + y^2))";

  return (
    <div className="space-y-4 pb-20">
      {/* Current Expression */}
      <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <span className="text-[10px] text-purple-400 uppercase tracking-wider">
          {t("calculus.threed.current_surface")}
        </span>
        <code className="block mt-1 text-white font-mono text-sm">
          z = {expression}
        </code>
      </div>

      {/* Color Mode */}
      <div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-2 mb-2">
          <Palette size={12} />
          {t("calculus.threed.color_modes.title")}
        </span>
        <div className="space-y-2">
          {COLOR_MODES.map(({ id, color, activeClass }) => (
            <button
              key={id}
              onClick={() => setState((s) => ({ ...s, colorMode: id }))}
              className={`w-full p-3 rounded-lg text-left transition-all border ${
                state.colorMode === id
                  ? activeClass
                  : "bg-white/5 hover:bg-white/10 border-transparent"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  state.colorMode === id ? color : "text-white"
                }`}
              >
                {t(`calculus.threed.color_modes.${id}`)}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(`calculus.threed.color_modes.${id}_desc`)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Color Pickers */}
      {/* Color Pickers */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10">
        <div>
          <ColorPicker
            label="Color 1"
            value={state.surfaceColor1}
            onChange={(color) =>
              setState((s) => ({ ...s, surfaceColor1: color }))
            }
          />
        </div>
        <div>
          <ColorPicker
            label="Color 2"
            value={state.surfaceColor2}
            onChange={(color) =>
              setState((s) => ({ ...s, surfaceColor2: color }))
            }
            align="right"
          />
        </div>
      </div>

      {/* Clipping Controls */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          Clipping
        </span>
        {(["clipX", "clipY", "clipZ"] as const).map((axis) => (
          <div key={axis} className="flex items-center gap-2">
            <span
              className={`w-4 text-xs font-bold ${
                axis === "clipX"
                  ? "text-red-400"
                  : axis === "clipY"
                    ? "text-green-400"
                    : "text-blue-400"
              }`}
            >
              {axis.slice(-1).toUpperCase()}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state[axis]}
              onChange={(e) =>
                setState((s) => ({ ...s, [axis]: Number(e.target.value) }))
              }
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
            <span className="text-xs text-slate-400 w-8">
              {(state[axis]! * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
