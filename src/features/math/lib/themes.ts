/**
 * MathLab Module Themes
 *
 * Color themes for each module type used in cards and UI elements.
 */

export const DEFAULT_THEME = {
  border: "border-slate-500",
  icon: "text-slate-500",
  text: "text-slate-500",
  glow: "from-slate-500/20 to-transparent",
} as const;

export interface ModuleTheme {
  border: string;
  icon: string;
  text: string;
  glow: string;
}

export const MODULE_THEMES: Record<string, ModuleTheme> = {
  analytics: {
    border: "border-emerald-500/30 group-hover:border-emerald-500",
    icon: "text-emerald-400",
    text: "text-emerald-400",
    glow: "from-emerald-500/20 to-transparent",
  },
  symbolic: {
    border: "border-red-500/30 group-hover:border-red-500",
    icon: "text-red-400",
    text: "text-red-400",
    glow: "from-red-500/20 to-transparent",
  },
  vectors: {
    border: "border-amber-500/30 group-hover:border-amber-500",
    icon: "text-amber-400",
    text: "text-amber-400",
    glow: "from-amber-500/20 to-transparent",
  },
  formulas: {
    border: "border-blue-500/30 group-hover:border-blue-500",
    icon: "text-blue-400",
    text: "text-blue-400",
    glow: "from-blue-500/20 to-transparent",
  },
  "3d": {
    border: "border-violet-500/30 group-hover:border-violet-500",
    icon: "text-violet-400",
    text: "text-violet-400",
    glow: "from-violet-500/20 to-transparent",
  },
  gym: {
    border: "border-orange-500/30 group-hover:border-orange-500",
    icon: "text-orange-400",
    text: "text-orange-400",
    glow: "from-orange-500/20 to-transparent",
  },
  tutor: {
    border: "border-cyan-500/30 group-hover:border-cyan-500",
    icon: "text-cyan-400",
    text: "text-cyan-400",
    glow: "from-cyan-500/20 to-transparent",
  },
  concepts: {
    border: "border-pink-500/30 group-hover:border-pink-500",
    icon: "text-pink-400",
    text: "text-pink-400",
    glow: "from-pink-500/20 to-transparent",
  },
  snap: {
    border: "border-teal-500/30 group-hover:border-teal-500",
    icon: "text-teal-400",
    text: "text-teal-400",
    glow: "from-teal-500/20 to-transparent",
  },
};

/**
 * Get theme for a module, falling back to default if not found
 */
export const getModuleTheme = (moduleId: string): ModuleTheme => {
  return MODULE_THEMES[moduleId] ?? DEFAULT_THEME;
};
