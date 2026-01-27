import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { BookOpen, Brain } from "lucide-react";

import { ArgumentArchitect } from "./components/ArgumentArchitect";

export { ArgumentArchitect as LogicStage };

export const LogicLab = () => {
  const { t } = useTranslations();
  useVoiceCoachContext(
    "PhilosophyLab",
    t(
      "philosophy.logic.voice_coach",
      "Welkom bij de Argument Architect. Bouw een geldig syllogisme door de premissen in de juiste volgorde te plaatsen.",
    ),
    { tool: "logic" },
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <h1 className="text-[15rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>
      <div className="relative z-10 w-full h-full">
        <ArgumentArchitect />
      </div>
    </div>
  );
};

export const LogicSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
          {t("philosophy.logic.sidebar_title", "Vectoren van Logica")}
        </h3>
        <div className="space-y-2">
          <button className="w-full p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-white transition-all hover:bg-white/10 group">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <Brain size={18} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">
                {t("philosophy.logic.constructor_title", "Constructeur")}
              </div>
              <div className="text-[10px] text-slate-500">
                {t("philosophy.logic.constructor_subtitle", "Bouw Syllogismen")}
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            {t("philosophy.logic.theory_focus", "Theorie Focus")}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {t(
            "philosophy.logic.theory_desc",
            "Op het VWO-examen moet je redeneringen kunnen toetsen op geldigheid en houdbaarheid.",
          )}
        </p>
      </div>
    </div>
  );
};
