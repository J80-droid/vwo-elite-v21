import { ChevronRight } from "lucide-react";
import React from "react";

interface ConceptCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  domain: string;
  onClick: () => void;
}

const CONCEPT_THEMES: Record<
  string,
  { border: string; glow: string; text: string; bg: string }
> = {
  tuner: {
    border: "border-emerald-500/20 hover:border-emerald-500/50",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    text: "text-emerald-400",
    bg: "bg-emerald-500/5",
  },
  sketcher: {
    border: "border-indigo-500/20 hover:border-indigo-500/50",
    glow: "shadow-[0_0_30px_rgba(99,102,241,0.15)]",
    text: "text-indigo-400",
    bg: "bg-indigo-500/5",
  },
  chain: {
    border: "border-purple-500/20 hover:border-purple-500/50",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    text: "text-purple-400",
    bg: "bg-purple-500/5",
  },
  "unit-circle": {
    border: "border-cyan-500/20 hover:border-cyan-500/50",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    text: "text-cyan-400",
    bg: "bg-cyan-500/5",
  },
  riemann: {
    border: "border-amber-500/20 hover:border-amber-500/50",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    text: "text-amber-400",
    bg: "bg-amber-500/5",
  },
  vector: {
    border: "border-blue-500/20 hover:border-blue-500/50",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    text: "text-blue-400",
    bg: "bg-blue-500/5",
  },
};

export const ConceptCard: React.FC<ConceptCardProps> = ({
  id,
  title,
  description,
  icon,
  domain,
  onClick,
}) => {
  const theme = CONCEPT_THEMES[id] ?? CONCEPT_THEMES.tuner!;

  return (
    <button
      onClick={onClick}
      className={`
                group relative h-80 transition-all duration-500 border rounded-3xl p-6 text-left overflow-hidden
                bg-white/5 ${theme.border} hover:bg-white/[0.08] hover:scale-[1.02]
                ${theme.glow} hover:shadow-[0_0_35px_rgba(255,255,255,0.05)]
            `}
    >
      {/* Ambient Background Glow */}
      <div
        className={`absolute -inset-24 ${theme.bg} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-700 pointer-events-none`}
      />

      <div
        className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-all duration-700 rotate-12 ${theme.text} group-hover:rotate-0`}
      >
        <div style={{ transform: "scale(4)" }}>{icon}</div>
      </div>

      <div className="h-full flex flex-col justify-between relative z-10">
        <div>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 ${theme.text} text-[10px] font-black uppercase tracking-widest mb-4 border ${theme.border}`}
          >
            {domain}
          </div>
          <h3 className="text-2xl font-black text-white mb-2 group-hover:text-white transition-colors tracking-tight uppercase leading-tight">
            {title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
            Visualization Module
          </span>
          <div
            className={`
                        w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-all duration-300
                        border border-white/5 ${theme.text} group-hover:bg-white/10 group-hover:scale-110
                    `}
          >
            <ChevronRight size={24} />
          </div>
        </div>
      </div>
    </button>
  );
};
