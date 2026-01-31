/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslations } from "@shared/hooks/useTranslations";
import { motion } from "framer-motion";
import { ArrowRight, Star, Zap } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { getAllModules } from "../api/registry";

const THEMES = {
  dialogue: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    text: "text-purple-400",
    icon: "text-purple-400",
    accent: "bg-purple-500",
    shadow: "shadow-[0_0_30px_rgba(168,85,247,0.1)]",
  },
  logic: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    icon: "text-amber-400",
    accent: "bg-amber-500",
    shadow: "shadow-[0_0_30px_rgba(245,158,11,0.1)]",
  },
  ethics: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    icon: "text-emerald-400",
    accent: "bg-emerald-500",
    shadow: "shadow-[0_0_30px_rgba(16,185,129,0.1)]",
  },
  "concept-matrix": {
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/5",
    text: "text-indigo-400",
    icon: "text-indigo-400",
    accent: "bg-indigo-500",
    shadow: "shadow-[0_0_30px_rgba(99,102,241,0.1)]",
  },
  exam: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    text: "text-rose-400",
    icon: "text-rose-400",
    accent: "bg-rose-500",
    shadow: "shadow-[0_0_30px_rgba(244,63,94,0.1)]",
  },
  analysis: {
    border: "border-fuchsia-500/30",
    bg: "bg-fuchsia-500/5",
    text: "text-fuchsia-400",
    icon: "text-fuchsia-400",
    accent: "bg-fuchsia-500",
    shadow: "shadow-[0_0_30px_rgba(217,70,239,0.1)]",
  },
  "techno-human": {
    border: "border-indigo-400/30",
    bg: "bg-indigo-400/5",
    text: "text-indigo-300",
    icon: "text-indigo-300",
    accent: "bg-indigo-400",
    shadow: "shadow-[0_0_30px_rgba(129,140,248,0.1)]",
  },
  battle: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    text: "text-rose-400",
    icon: "text-rose-400",
    accent: "bg-rose-500",
    shadow: "shadow-[0_0_30px_rgba(244,63,94,0.1)]",
  },
  science: {
    border: "border-teal-500/30",
    bg: "bg-teal-500/5",
    text: "text-teal-400",
    icon: "text-teal-400",
    accent: "bg-teal-500",
    shadow: "shadow-[0_0_30px_rgba(20,184,166,0.1)]",
  },
  society: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    text: "text-violet-400",
    icon: "text-violet-400",
    accent: "bg-violet-500",
    shadow: "shadow-[0_0_30px_rgba(139,92,246,0.1)]",
  },
};

import { PhilosophyGymStage } from "./gym/PhilosophyGymStage";

export const PhilosophyHub: React.FC = () => {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const modules = getAllModules();

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-12">
      {/* Elite Header - Replicating SmartLibrary Hub feel */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/20 via-obsidian-900 to-black border border-white/5 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold tracking-widest uppercase">
                Elite Knowledge
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              {t("philosophy.hub_title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 text-glow-violet">
                {t("philosophy.hub_subtitle")}
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl font-light leading-relaxed">
              {t(
                "philosophy.hub_description",
                "Verken de diepten van het menselijk denken via Socratische dialogen, formele logica en ethische verkenning.",
              )}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-black/40 border border-white/5 backdrop-blur-md rounded-2xl p-4 min-w-[120px]">
              <div className="text-violet-400 font-black text-2xl">
                {modules.length}
              </div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                {t("philosophy.active_modules")}
              </div>
            </div>
            <div className="bg-black/40 border border-white/5 backdrop-blur-md rounded-2xl p-4 min-w-[120px]">
              <div className="text-fuchsia-400 font-black text-2xl">V3.0</div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                {t("philosophy.version")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid - Blueprint matching SmartLibrary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module: any, index: number) => {
          const theme =
            THEMES[module.id as keyof typeof THEMES] || THEMES.dialogue;
          const Icon = module.icon;

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => navigate(`/philosophy/${module.id}`)}
              className={`
                                relative group cursor-pointer p-8 rounded-[2rem] border backdrop-blur-md 
                                transition-all duration-500 h-[320px] flex flex-col justify-between
                                ${theme.border} ${theme.bg} ${theme.shadow} hover:bg-white/[0.07]
                            `}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div
                  className={`p-4 rounded-2xl bg-black/40 border border-white/5 ${theme.icon}`}
                >
                  <Icon size={32} strokeWidth={1.5} />
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border border-white/5 px-3 py-1 rounded-full bg-black/20">
                  {t("philosophy.module_n", { n: index + 1 })}
                </div>
              </div>

              {/* Card Content */}
              <div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all duration-300">
                  {module.label(t)}
                </h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed mb-6 group-hover:text-slate-300 transition-colors">
                  {typeof module.description === "function"
                    ? module.description(t)
                    : module.description || t("philosophy.hub_description")}
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-black bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {t("philosophy.level")}
                  </span>
                </div>
              </div>

              {/* Action Area */}
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Zap size={14} className={theme.icon} />
                  <span className="text-xs font-bold text-slate-400">
                    {t("philosophy.interactive_ai")}
                  </span>
                </div>
                <div
                  className={`p-2 rounded-full ${theme.accent} text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 shadow-lg`}
                >
                  <ArrowRight size={18} />
                </div>
              </div>

              {/* Hover Effects */}
              <div
                className={`absolute -inset-1 blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none rounded-[2rem] ${theme.accent}`}
              />
            </motion.div>
          );
        })}

        {/* Coming Soon Placeholder */}
        <div className="relative p-8 rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center opacity-30 hover:opacity-50 transition-opacity cursor-not-allowed h-[320px]">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Star size={32} className="text-slate-500" />
          </div>
          <h3 className="text-xl font-black text-slate-400 uppercase mb-2">
            {t("philosophy.metaphysics")}
          </h3>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
            {t("philosophy.coming_soon")}
          </p>
        </div>
      </div>

      {/* Embedded Gym Section */}
      <div className="space-y-6 pt-12 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
              Training <span className="text-purple-500">Gym</span>
            </h2>
            <p className="text-slate-400 text-sm">
              Oefen specifieke vaardigheden en concepten
            </p>
          </div>
          <button
            onClick={() => navigate("/philosophy/gym")}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white uppercase tracking-widest transition-all"
          >
            Full Screen Gym
          </button>
        </div>
        <PhilosophyGymStage embedded={true} />
      </div>
    </div>
  );
};
