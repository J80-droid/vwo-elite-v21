import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { Brain, Scale, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";

import { CasusSimulator } from "./components/CasusSimulator";
import { EthicsEngine } from "./components/EthicsEngine";
import { SJTStage } from "./components/SJTStage";

export const EthicsLab = () => {
  const { t } = useTranslations();
  const [activeTool, setActiveTool] = useState<"simulator" | "engine" | "sjt">(
    "simulator",
  );
  useVoiceCoachContext(
    "PhilosophyLab",
    t(
      "philosophy.ethics.voice_coach",
      `Ethiek Lab: Actief met ${activeTool}.`,
      { tool: activeTool },
    ),
    { tool: activeTool },
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <h1 className="text-[15rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
        <button
          onClick={() => setActiveTool("simulator")}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTool === "simulator" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]" : "border-transparent text-slate-500 hover:text-white hover:bg-white/5"}`}
        >
          {t("philosophy.ethics.casus.title", "Casus Simulator")}
        </button>
        <button
          onClick={() => setActiveTool("engine")}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTool === "engine" ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]" : "border-transparent text-slate-500 hover:text-white hover:bg-white/5"}`}
        >
          {t("philosophy.ethics.engine.title", "Ethics Engine")}
        </button>
        <button
          onClick={() => setActiveTool("sjt")}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTool === "sjt" ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-[0_0_20px_-5px_rgba(20,184,166,0.3)]" : "border-transparent text-slate-500 hover:text-white hover:bg-white/5"}`}
        >
          {t("language.sjt.title", "SJT Integrity")}
        </button>
      </div>

      {activeTool === "simulator" && <CasusSimulator />}
      {activeTool === "engine" && <EthicsEngine />}
      {activeTool === "sjt" && <SJTStage />}
    </div>
  );
};

export const EthicsSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
          {t("philosophy.ethics.sidebar_tools", "Ethische Lab-Tools")}
        </h3>
        <div className="space-y-2">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Zap size={18} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white">
                {t("philosophy.ethics.casus.title", "Ethiek Simulator")}
              </div>
              <div className="text-[10px] text-slate-500">
                {t("philosophy.ethics.casus.subtitle", "Examen Casuïstiek")}
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Scale size={18} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-indigo-200">
                {t("philosophy.ethics.engine.title", "Dilemma Engine")}
              </div>
              <div className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">
                {t(
                  "philosophy.ethics.engine.subtitle",
                  "Calculus & Imperatief",
                )}
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
              <Brain size={18} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-teal-200">
                {t("language.sjt.title", "Situational Judgement")}
              </div>
              <div className="text-[10px] text-teal-500 font-black uppercase tracking-widest">
                {t("language.sjt.subtitle", "Integriteitstoets")}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            {t("philosophy.ethics.frameworks_title", "Morele Kaders")}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-light">
          {t(
            "philosophy.ethics.frameworks_desc",
            "Train jezelf in het consequent toepassen van het Utilisme, de Plichtethiek en de Deugdethiek.",
          )}
        </p>
      </div>
    </div>
  );
};
