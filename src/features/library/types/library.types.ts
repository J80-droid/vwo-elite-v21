/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LibrarySubject {
  id: string;
  name: string;
  theme:
    | "blue"
    | "amber"
    | "emerald"
    | "rose"
    | "orange"
    | "purple"
    | "cyan"
    | "indigo"
    | "slate"
    | "sky"
    | "violet"
    | "lime"
    | "teal"
    | "fuchsia"
    | "stone"
    | "yellow"
    | "pink"
    | "red";
  icon: any; // Lucide icon
  averageGrade?: number;
  nextTestDate?: string; // YYYY-MM-DD
  nextTestName?: string;
  nextLessonDate?: string;
  nextLessonTopic?: string;
  progress?: number; // 0-100
  legacyName?: string; // For data store compatibility (e.g. "Wiskunde B")
}

export const SUBJECT_THEME_CONFIG: Record<
  string,
  { border: string; bg: string; text: string; shadow: string }
> = {
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    shadow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
  },
  amber: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    shadow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
  },
  emerald: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
  },
  rose: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    text: "text-rose-400",
    shadow: "shadow-[0_0_15px_rgba(244,63,94,0.1)]",
  },
  orange: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    text: "text-orange-400",
    shadow: "shadow-[0_0_15px_rgba(249,115,22,0.1)]",
  },
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    text: "text-purple-400",
    shadow: "shadow-[0_0_15px_rgba(168,85,247,0.1)]",
  },
  cyan: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    text: "text-cyan-400",
    shadow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
  },
  indigo: {
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/5",
    text: "text-indigo-400",
    shadow: "shadow-[0_0_15px_rgba(99,102,241,0.1)]",
  },
  slate: {
    border: "border-slate-500/30",
    bg: "bg-slate-500/5",
    text: "text-slate-400",
    shadow: "shadow-[0_0_15px_rgba(100,116,139,0.1)]",
  },
  // New Neon additions
  sky: {
    border: "border-sky-500/30",
    bg: "bg-sky-500/5",
    text: "text-sky-400",
    shadow: "shadow-[0_0_15px_rgba(14,165,233,0.1)]",
  },
  violet: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    text: "text-violet-400",
    shadow: "shadow-[0_0_15px_rgba(139,92,246,0.1)]",
  },
  lime: {
    border: "border-lime-500/30",
    bg: "bg-lime-500/5",
    text: "text-lime-400",
    shadow: "shadow-[0_0_15px_rgba(132,204,22,0.1)]",
  },
  teal: {
    border: "border-teal-500/30",
    bg: "bg-teal-500/5",
    text: "text-teal-400",
    shadow: "shadow-[0_0_15px_rgba(20,184,166,0.1)]",
  },
  fuchsia: {
    border: "border-fuchsia-500/30",
    bg: "bg-fuchsia-500/5",
    text: "text-fuchsia-400",
    shadow: "shadow-[0_0_15px_rgba(217,70,239,0.1)]",
  },
  stone: {
    border: "border-stone-500/30",
    bg: "bg-stone-500/5",
    text: "text-stone-400",
    shadow: "shadow-[0_0_15px_rgba(120,113,108,0.1)]",
  },
  yellow: {
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    text: "text-yellow-400",
    shadow: "shadow-[0_0_15px_rgba(234,179,8,0.1)]",
  },
  pink: {
    border: "border-pink-500/30",
    bg: "bg-pink-500/5",
    text: "text-pink-400",
    shadow: "shadow-[0_0_15px_rgba(236,72,153,0.1)]",
  },
  red: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    text: "text-red-400",
    shadow: "shadow-[0_0_15px_rgba(239,68,68,0.1)]",
  },
  default: {
    border: "border-slate-500/30",
    bg: "bg-slate-500/5",
    text: "text-slate-400",
    shadow: "shadow-[0_0_15px_rgba(100,116,139,0.1)]",
  },
};
