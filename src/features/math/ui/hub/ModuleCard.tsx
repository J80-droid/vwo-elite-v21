/**
 * Sortable Module Card
 *
 * A draggable card component for the MathLab hub grid.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getModuleTheme } from "@features/math/lib/themes";
import type { MathModuleConfig } from "@features/math/types";
import { List, Sigma as SigmaIcon } from "lucide-react";
import React from "react";

interface ModuleCardProps {
  mod: MathModuleConfig;
  onSelect: (id: string) => void;
  t: (key: string) => string;
  isOverlay?: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  mod,
  onSelect,
  t,
  isOverlay = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id });

  const theme = getModuleTheme(mod.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : 1,
  };

  // Overlay version for drag preview
  if (isOverlay) {
    return (
      <div className="h-56 scale-105 cursor-grabbing z-50">
        <div
          className={`
                    relative p-6 rounded-3xl border backdrop-blur-md flex flex-col justify-between h-full
                    ${theme.border.replace("group-hover:", "")} bg-black/80 shadow-2xl
                `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl bg-black/40 border border-white/5 ${theme.icon}`}
            >
              <mod.icon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white uppercase">
                {mod.label(t)}
              </h3>
              <p
                className={`text-[10px] font-bold opacity-60 uppercase tracking-widest ${theme.icon}`}
              >
                Elite Math
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard interactive card
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none h-full"
    >
      <div
        onClick={() => onSelect(mod.id)}
        className={`
                    relative p-6 rounded-3xl border backdrop-blur-md transition-all duration-300
                    group cursor-pointer flex flex-col justify-between h-56
                    bg-black/40 border-white/5 hover:bg-black/60
                    ${theme.border} hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]
                `}
      >
        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl bg-black/40 border border-white/5 transition-colors duration-300 ${theme.icon} group-hover:bg-white/5`}
            >
              <mod.icon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white uppercase group-hover:text-white/90 transition-colors">
                {mod.label(t)}
              </h3>
              <p
                className={`text-[10px] font-bold opacity-60 uppercase tracking-widest ${theme.text}`}
              >
                Elite Math
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-6 mt-2 relative z-10">
          <div className="relative w-16 h-12 flex items-center justify-center rounded-lg bg-white/5 border border-white/5">
            <SigmaIcon size={20} className={`opacity-50 ${theme.icon}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${theme.text}`}>Ready</span>
            <span className="text-xs text-slate-400 line-clamp-1">
              Mathematical Engine
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <List
              size={14}
              className="text-slate-500 group-hover:text-cyan-400 transition-colors"
            />
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
              VWO Module
            </span>
          </div>

          <div
            className={`
                        font-mono text-sm font-bold bg-black/30 px-3 py-1 rounded
                        transition-all duration-300
                        ${theme.text} group-hover:bg-white/10
                    `}
          >
            OPEN
          </div>
        </div>

        {/* Glow Effect */}
        <div
          className={`absolute -inset-1 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${theme.glow.replace("group-hover:", "")}`}
        />
      </div>
    </div>
  );
};
