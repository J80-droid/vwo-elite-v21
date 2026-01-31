import { ChevronRight, Trophy } from "lucide-react";
import React from "react";

import { GymThemeColor } from "./types/config";

interface EngineCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: number;
  mastery?: number; // 0-100
  themeColor: GymThemeColor;
  onClick?: () => void;
}

const getThemeStyles = (color: GymThemeColor) => {
  const styles: Partial<Record<GymThemeColor, { border: string; glow: string; text: string; bg: string; bar: string }>> = {
    orange: { border: "border-orange-500/20 hover:border-orange-500/50", text: "text-orange-400", bg: "bg-orange-500/5", glow: "shadow-[0_0_30px_rgba(249,115,22,0.15)]", bar: "bg-orange-500" },
    cyan: { border: "border-cyan-500/20 hover:border-cyan-500/50", text: "text-cyan-400", bg: "bg-cyan-500/5", glow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]", bar: "bg-cyan-500" },
    blue: { border: "border-blue-500/20 hover:border-blue-500/50", text: "text-blue-400", bg: "bg-blue-500/5", glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]", bar: "bg-blue-500" },
    rose: { border: "border-rose-500/20 hover:border-rose-500/50", text: "text-rose-400", bg: "bg-rose-500/5", glow: "shadow-[0_0_30px_rgba(244,63,94,0.15)]", bar: "bg-rose-500" },
    purple: { border: "border-purple-500/20 hover:border-purple-500/50", text: "text-purple-400", bg: "bg-purple-500/5", glow: "shadow-[0_0_30px_rgba(168,85,247,0.15)]", bar: "bg-purple-500" },
    amber: { border: "border-amber-500/20 hover:border-amber-500/50", text: "text-amber-400", bg: "bg-amber-500/5", glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]", bar: "bg-amber-500" },
    lime: { border: "border-lime-500/20 hover:border-lime-500/50", text: "text-lime-400", bg: "bg-lime-500/5", glow: "shadow-[0_0_30_rgba(132,204,22,0.15)]", bar: "bg-lime-500" },
    red: { border: "border-red-500/20 hover:border-red-500/50", text: "text-red-400", bg: "bg-red-500/5", glow: "shadow-[0_0_30px_rgba(239,68,68,0.15)]", bar: "bg-red-500" },
    pink: { border: "border-pink-500/20 hover:border-pink-500/50", text: "text-pink-400", bg: "bg-pink-500/5", glow: "shadow-[0_0_30px_rgba(236,72,153,0.15)]", bar: "bg-pink-500" },
    fuchsia: { border: "border-fuchsia-500/20 hover:border-fuchsia-500/50", text: "text-fuchsia-400", bg: "bg-fuchsia-500/5", glow: "shadow-[0_0_30px_rgba(192,38,211,0.15)]", bar: "bg-fuchsia-500" },
    emerald: { border: "border-emerald-500/20 hover:border-emerald-500/50", text: "text-emerald-400", bg: "bg-emerald-500/5", glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]", bar: "bg-emerald-500" },
    indigo: { border: "border-indigo-500/20 hover:border-indigo-500/50", text: "text-indigo-400", bg: "bg-indigo-500/5", glow: "shadow-[0_0_30px_rgba(99,102,241,0.15)]", bar: "bg-indigo-500" },
    teal: { border: "border-teal-500/20 hover:border-teal-500/50", text: "text-teal-400", bg: "bg-teal-500/5", glow: "shadow-[0_0_30px_rgba(20,184,166,0.15)]", bar: "bg-teal-500" },
    slate: { border: "border-slate-500/20 hover:border-slate-500/50", text: "text-slate-400", bg: "bg-slate-500/5", glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]", bar: "bg-slate-500" },
  };
  return styles[color] || styles.slate!;
};

export const GymEngineCard: React.FC<EngineCardProps> = ({
  title,
  description,
  icon,
  difficulty,
  mastery = 0,
  themeColor,
  onClick,
}) => {
  const theme = getThemeStyles(themeColor);

  return (
    <button
      onClick={onClick}
      className={`
        group relative h-64 transition-all duration-500 border rounded-3xl p-6 text-left overflow-hidden flex flex-col
        bg-white/5 ${theme.border} hover:bg-white/[0.08] hover:scale-[1.02]
        ${theme.glow} hover:shadow-[0_0_35px_rgba(255,255,255,0.05)]
      `}
    >
      {/* Ambient Background Glow */}
      <div className={`absolute -inset-24 ${theme.bg} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-700 pointer-events-none`} />

      {/* Floating Icon */}
      <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-all duration-700 rotate-12 ${theme.text} group-hover:rotate-0`}>
        <div style={{ transform: "scale(3.5)" }}>{icon}</div>
      </div>

      <div className="flex-1 relative z-10 w-full">
        <div className="flex justify-between items-start mb-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 ${theme.text} text-[10px] font-black uppercase tracking-widest border ${theme.border}`}>
            Gym Drill
          </div>
          {/* Mastery Badge */}
          {mastery > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Trophy size={10} className={mastery >= 100 ? "text-amber-400" : "text-slate-600"} />
              <span>{mastery}%</span>
            </div>
          )}
        </div>

        <h3 className="text-xl font-black text-white mb-2 group-hover:text-white transition-colors tracking-tight uppercase truncate pr-8">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed font-medium line-clamp-2">
          {description}
        </p>
      </div>

      <div className="w-full relative z-10 mt-auto space-y-3">
        {/* Mastery Progress Bar */}
        <div className="w-full h-1 bg-slate-800/50 rounded-full overflow-hidden">
          <div
            className={`h-full ${theme.bar} transition-all duration-1000 ease-out`}
            style={{ width: `${mastery}%` }}
          />
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
            LVL {difficulty}
          </span>
          <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center transition-all duration-300 border border-white/5 ${theme.text} group-hover:bg-white/10 group-hover:scale-110`}>
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </button>
  );
};
