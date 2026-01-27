import { useModuleState } from "@features/philosophy/hooks/PhilosophyLabContext";
import {
  defaultDialogueState,
  DialogueState,
} from "@features/philosophy/types";
import { useTranslations } from "@shared/hooks/useTranslations";
import { motion } from "framer-motion";
import { BookOpen, Brain, Crown, Sparkles, User } from "lucide-react";
import React from "react";

export const DialogueSidebar: React.FC = () => {
  const [state, setState] = useModuleState<DialogueState>(
    "dialogue",
    defaultDialogueState,
  );
  const { t } = useTranslations();

  const philosophers = [
    {
      id: "Socrates",
      name: "Socrates",
      label: "Socrates",
      icon: User,
      era: "Oudheid",
      desc: t("philosophy.dialogue.socrates_desc", "Bevraag alles."),
    },
    {
      id: "Plato",
      name: "Plato",
      label: "Plato",
      icon: Crown,
      era: "Oudheid",
      desc: t("philosophy.dialogue.plato_desc", "De wereld der ideeën."),
    },
    {
      id: "Aristotle",
      name: "Aristoteles",
      label: "Aristoteles",
      icon: BookOpen,
      era: "Oudheid",
      desc: t("philosophy.dialogue.aristotle_desc", "Logica en deugd."),
    },
    {
      id: "Kant",
      name: "Immanuel Kant",
      label: "Immanuel Kant",
      icon: Brain,
      era: "Verlichting",
      desc: t("philosophy.dialogue.kant_desc", "Categorisch imperatief."),
    },
    {
      id: "Nietzsche",
      name: "Friedrich Nietzsche",
      label: "Nietzsche",
      icon: Sparkles,
      era: "Modernisme",
      desc: t("philosophy.dialogue.nietzsche_desc", "Wil tot macht."),
    },
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto custom-scrollbar bg-black/40 border-r border-white/[0.04]">
      {/* 0. MODULE METADATA */}
      <div className="space-y-4 px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <User size={12} className="text-violet-500" />
            {t("philosophy.dialogue.select_philosopher", "Kies een Filosoof")}
          </h3>
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-violet-500/50" />
            <div className="w-1 h-1 rounded-full bg-violet-500/30" />
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-violet-500/40 via-violet-500/10 to-transparent" />
      </div>

      {/* 1. FLOATING GLASS CARDS */}
      <div className="flex flex-col gap-4">
        {philosophers.map((p) => {
          const isActive = state.philosopherPersona === p.id;
          return (
            <motion.button
              key={p.id}
              onClick={() =>
                setState((prev) => ({ ...prev, philosopherPersona: p.id }))
              }
              whileHover={{ y: -2, x: 2 }}
              animate={
                isActive
                  ? {
                      boxShadow: "0 20px 50px -15px rgba(124,58,237,0.3)",
                      borderColor: "rgba(124,58,237,0.5)",
                    }
                  : {}
              }
              className={`
                                w-full group relative h-32 rounded-[2rem] transition-all duration-700
                                border flex flex-col items-center justify-center gap-3 overflow-hidden
                                ${
                                  isActive
                                    ? "bg-gradient-to-br from-violet-600/20 to-violet-900/40 border-violet-400/50 shadow-[0_20px_50px_-15px_rgba(124,58,237,0.3)]"
                                    : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08] hover:border-white/20"
                                }
                            `}
            >
              {/* Inner Glass Highlight */}
              <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

              {/* Background Logic Bloom */}
              {isActive && (
                <div className="absolute -inset-x-10 -inset-y-10 bg-violet-600/5 blur-2xl animate-pulse" />
              )}

              <div
                className={`
                                p-2.5 rounded-2xl bg-black/80 border border-white/[0.08] transition-all duration-500
                                ${isActive ? "scale-110 border-violet-500/50 shadow-lg shadow-violet-500/20" : "group-hover:border-white/20"}
                            `}
              >
                <p.icon
                  size={20}
                  className={isActive ? "text-violet-400" : "text-slate-500"}
                />
              </div>

              <div className="text-center px-4">
                <span
                  className={`
                                    block text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1
                                    ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}
                                `}
                >
                  {p.label}
                </span>
                <span className="text-[8px] font-medium text-slate-600 uppercase tracking-widest line-clamp-1">
                  {p.desc}
                </span>
              </div>

              {/* Precision Status Indicator */}
              <div className="relative flex items-center justify-center ml-2">
                <div
                  className={`w-3 h-3 rounded-full border border-white/10 flex items-center justify-center transition-all duration-700 ${isActive ? "border-violet-500 scale-100" : "scale-50 opacity-0 group-hover:opacity-100"}`}
                >
                  <div
                    className={`w-1 h-1 rounded-full transition-all duration-500 ${isActive ? "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,1)]" : "bg-white/20"}`}
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 2. FOOTER PROTOCOL */}
      <div className="pt-4 border-t border-white/[0.04] mt-auto">
        <div className="px-2 flex items-center justify-between opacity-30 group-hover:opacity-60 transition-opacity duration-500 cursor-default">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
            Elite OS // Philosophy Hub
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
        </div>
      </div>
    </div>
  );
};
