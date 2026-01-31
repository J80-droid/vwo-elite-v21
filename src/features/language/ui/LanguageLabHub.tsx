import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Dumbbell,
  Languages,
  MessageSquare,
  Mic,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useLanguageLabContext } from "../hooks/LanguageLabContext";

export const LanguageLabHub: React.FC = () => {
  const navigate = useNavigate();
  const { activeLanguage } = useLanguageLabContext();

  const modules = [
    {
      id: "scenarios",
      title: "Roleplay Scenarios",
      description:
        "Oefen gesprekken in realistische situaties met AI-gestuurde rollenspellen.",
      icon: MessageSquare,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      hover: "group-hover:border-orange-500/50",
      delay: 0.1,
    },
    {
      id: "idioms",
      title: "Idioms & Phrases",
      description: "Beheers spreekwoorden en uitdrukkingen in context.",
      icon: BookOpen,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      hover: "group-hover:border-amber-500/50",
      delay: 0.2,
    },
    {
      id: "sjt",
      title: "Situational Judgment",
      description:
        "Test je culturele inzicht en oordeelsvermogen in vreemde talen.",
      icon: UserCheck,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      hover: "group-hover:border-rose-500/50",
      delay: 0.3,
    },
    {
      id: "presentation",
      title: "Presentation Coach",
      description:
        "Verbeter je presentatievaardigheden met real-time emotie-analyse via Hume AI.",
      icon: Mic,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      hover: "group-hover:border-cyan-500/50",
      delay: 0.4,
    },
    {
      id: "gym",
      title: "Language Gym",
      description: "Train je taalvaardigheid met razendsnelle interactieve oefeningen.",
      icon: Dumbbell,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      hover: "group-hover:border-emerald-500/50",
      delay: 0.5,
    },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Language{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
              Lab
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl font-light">
            Polyglot Engine Active. Verbeter je spreekvaardigheid en cultureel
            inzicht.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <motion.button
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: module.delay }}
              onClick={() =>
                navigate(`/language/${activeLanguage}/${module.id}`)
              }
              className={`group relative p-8 rounded-3xl border ${module.border} ${module.bg} backdrop-blur-sm text-left transition-all duration-300 hover:-translate-y-1 ${module.hover}`}
            >
              <div className="mb-6 p-4 rounded-2xl bg-black/20 w-fit">
                <module.icon size={32} className={module.color} />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                {module.title}
              </h3>

              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                {module.description}
              </p>

              <div
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${module.color} opacity-60 group-hover:opacity-100 transition-opacity`}
              >
                Start Module{" "}
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Info Block */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-8 rounded-3xl bg-white/5 border border-white/10"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-2">
              <h4 className="flex items-center gap-3 text-lg font-bold text-white">
                <Languages size={20} className="text-orange-400" />
                Multi-Lang Support
              </h4>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[100%] bg-gradient-to-r from-orange-500 to-amber-500" />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                <span>EN / NL / FR / ES / DE</span>
                <span>ALL SYSTEMS GO</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
