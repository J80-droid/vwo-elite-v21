import { ChevronRight } from "lucide-react";
import React from "react";

interface EngineCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: number;
  onClick?: () => void;
}

// Theme Mapping (Neon Elite)
const ENGINE_THEMES: Record<
  string,
  { border: string; glow: string; text: string; bg: string }
> = {
  fractions: {
    border: "border-orange-500/20 hover:border-orange-500/50",
    glow: "shadow-[0_0_30px_rgba(249,115,22,0.15)]",
    text: "text-orange-400",
    bg: "bg-orange-500/5",
  },
  exponents: {
    border: "border-cyan-500/20 hover:border-cyan-500/50",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    text: "text-cyan-400",
    bg: "bg-cyan-500/5",
  },
  trig: {
    border: "border-blue-500/20 hover:border-blue-500/50",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    text: "text-blue-400",
    bg: "bg-blue-500/5",
  },
  derivs: {
    border: "border-rose-500/20 hover:border-rose-500/50",
    glow: "shadow-[0_0_30px_rgba(244,63,94,0.15)]",
    text: "text-rose-400",
    bg: "bg-rose-500/5",
  },
  formulas: {
    border: "border-violet-500/20 hover:border-violet-500/50",
    glow: "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    text: "text-violet-400",
    bg: "bg-violet-500/5",
  },
  vectors: {
    border: "border-amber-500/20 hover:border-amber-500/50",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    text: "text-amber-400",
    bg: "bg-amber-500/5",
  },
  integraal: {
    border: "border-lime-500/20 hover:border-lime-500/50",
    glow: "shadow-[0_0_30px_rgba(132,204,22,0.15)]",
    text: "text-lime-400",
    bg: "bg-lime-500/5",
  },
  limits: {
    border: "border-red-500/20 hover:border-red-500/50",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.15)]",
    text: "text-red-400",
    bg: "bg-red-500/5",
  },
  domain: {
    border: "border-pink-500/20 hover:border-pink-500/50",
    glow: "shadow-[0_0_30px_rgba(236,72,153,0.15)]",
    text: "text-pink-400",
    bg: "bg-pink-500/5",
  },
  geometry: {
    border: "border-fuchsia-500/20 hover:border-fuchsia-500/50",
    glow: "shadow-[0_0_30px_rgba(192,38,211,0.15)]",
    text: "text-fuchsia-400",
    bg: "bg-fuchsia-500/5",
  },
  // Physics Engines
  units: {
    border: "border-blue-500/20 hover:border-blue-500/50",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    text: "text-blue-400",
    bg: "bg-blue-500/5",
  },
  sigfig: {
    border: "border-emerald-500/20 hover:border-emerald-500/50",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    text: "text-emerald-400",
    bg: "bg-emerald-500/5",
  },
  isolator: {
    border: "border-purple-500/20 hover:border-purple-500/50",
    glow: "shadow-[0_0_30_px_rgba(168,85,247,0.15)]",
    text: "text-purple-400",
    bg: "bg-purple-500/5",
  },
  "phys-vectors": {
    border: "border-rose-500/20 hover:border-rose-500/50",
    glow: "shadow-[0_0_30px_rgba(244,63,94,0.15)]",
    text: "text-rose-400",
    bg: "bg-rose-500/5",
  },
  decay: {
    border: "border-amber-500/20 hover:border-amber-500/50",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    text: "text-amber-400",
    bg: "bg-amber-500/5",
  },
  circuits: {
    border: "border-cyan-500/20 hover:border-cyan-500/50",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    text: "text-cyan-400",
    bg: "bg-cyan-500/5",
  },
  graphs: {
    border: "border-indigo-500/20 hover:border-indigo-500/50",
    glow: "shadow-[0_0_30px_rgba(99,102,241,0.15)]",
    text: "text-indigo-400",
    bg: "bg-indigo-500/5",
  },
  flashcards: {
    border: "border-teal-500/20 hover:border-teal-500/50",
    glow: "shadow-[0_0_30px_rgba(20,184,166,0.15)]",
    text: "text-teal-400",
    bg: "bg-teal-500/5",
  },
  "mix-math": {
    border: "border-amber-500/50 hover:border-amber-500/70",
    glow: "shadow-[0_0_40px_rgba(245,158,11,0.2)]",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  "mix-physics": {
    border: "border-amber-500/50 hover:border-amber-500/70",
    glow: "shadow-[0_0_40px_rgba(245,158,11,0.2)]",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
  },
};

export const GymEngineCard: React.FC<EngineCardProps> = ({
  id,
  title,
  description,
  icon,
  difficulty,
  onClick,
}) => {
  const theme = ENGINE_THEMES[id] ?? ENGINE_THEMES.fractions!;

  return (
    <button
      onClick={onClick}
      className={`
                group relative h-64 transition-all duration-500 border rounded-3xl p-6 text-left overflow-hidden
                bg-white/5 ${theme.border} hover:bg-white/[0.08] hover:scale-[1.02]
                ${theme.glow} hover:shadow-[0_0_35px_rgba(255,255,255,0.05)]
            `}
    >
      {/* Ambient Background Glow (Engine Specific) */}
      <div
        className={`absolute -inset-24 ${theme.bg} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-700 pointer-events-none`}
      />

      <div
        className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-all duration-700 rotate-12 ${theme.text} group-hover:rotate-0`}
      >
        <div style={{ transform: "scale(3.5)" }}>{icon}</div>
      </div>

      <div className="h-full flex flex-col justify-between relative z-10">
        <div>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 ${theme.text} text-[10px] font-black uppercase tracking-widest mb-4 border ${theme.border}`}
          >
            Gym Drill
          </div>
          <h3 className="text-xl font-black text-white mb-2 group-hover:text-white transition-colors tracking-tight uppercase">
            {title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-xs font-mono font-bold text-slate-500">
            LVL {difficulty}
          </span>
          <div
            className={`
                        w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-all duration-300
                        border border-white/5 ${theme.text} group-hover:bg-white/10 group-hover:scale-110
                    `}
          >
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </button>
  );
};
