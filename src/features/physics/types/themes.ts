export const MODULE_THEMES: Record<
  string,
  {
    border: string;
    bg: string;
    text: string;
    shadow: string;
    icon: string;
    glow: string;
  }
> = {
  optics: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    text: "text-cyan-400",
    shadow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
    icon: "text-cyan-400",
    glow: "from-cyan-500/20 to-blue-600/5",
  },
  mechanics: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    text: "text-rose-400",
    shadow: "shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    icon: "text-rose-400",
    glow: "from-rose-500/20 to-orange-600/5",
  },
  quantum: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    text: "text-violet-400",
    shadow: "shadow-[0_0_15px_rgba(139,92,246,0.1)]",
    icon: "text-violet-400",
    glow: "from-violet-500/20 to-indigo-600/5",
  },
  nuclear: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    shadow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    icon: "text-amber-400",
    glow: "from-amber-500/20 to-yellow-600/5",
  },
  waves: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    icon: "text-emerald-400",
    glow: "from-emerald-500/20 to-teal-600/5",
  },
  circuits: {
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    text: "text-yellow-400",
    shadow: "shadow-[0_0_15px_rgba(234,179,8,0.1)]",
    icon: "text-yellow-400",
    glow: "from-yellow-500/20 to-orange-600/5",
  },
  thermodynamics: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    text: "text-orange-400",
    shadow: "shadow-[0_0_15px_rgba(249,115,22,0.1)]",
    icon: "text-orange-400",
    glow: "from-orange-500/20 to-red-600/5",
  },
  vectors: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    shadow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    icon: "text-blue-400",
    glow: "from-blue-500/20 to-indigo-600/5",
  },
  snap: {
    border: "border-fuchsia-500/30",
    bg: "bg-fuchsia-500/5",
    text: "text-fuchsia-400",
    shadow: "shadow-[0_0_15px_rgba(217,70,239,0.1)]",
    icon: "text-fuchsia-400",
    glow: "from-fuchsia-500/20 to-pink-600/5",
  },
  interference: {
    border: "border-sky-500/30",
    bg: "bg-sky-500/5",
    text: "text-sky-400",
    shadow: "shadow-[0_0_15px_rgba(56,189,248,0.1)]",
    icon: "text-sky-400",
    glow: "from-sky-500/20 to-indigo-600/5",
  },
};

export const DEFAULT_THEME = {
  border: "border-emerald-500/30",
  bg: "bg-emerald-500/5",
  text: "text-emerald-400",
  shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
  icon: "text-emerald-400",
  glow: "from-emerald-500/20 to-teal-600/5",
};
