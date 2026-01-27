import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { FileText } from "lucide-react";

import { ExamTrainer } from "./ExamTrainer";

const ExamLab = () => {
  const { t } = useTranslations();
  useVoiceCoachContext(
    "PhilosophyLab",
    t(
      "philosophy.exam.voice_coach",
      "Voorbereiding op het vwo-examen filosofie.",
    ),
    { tool: "exam" },
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <h1 className="text-[15rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>
      <ExamTrainer />
    </div>
  );
};

export { ExamLab as ExamTrainer };

export const ExamSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
        {t("philosophy.exam.sidebar_title", "Examen Modes")}
      </h3>
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-white transition-all hover:bg-white/10 group">
        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
          <FileText size={18} />
        </div>
        <div className="text-left">
          <div className="text-sm font-bold">
            {t("philosophy.exam.trainer_mode", "Trainer Mode")}
          </div>
          <div className="text-[10px] text-slate-500">
            {t("philosophy.exam.structured_answers", "Gestatueerd Antwoorden")}
          </div>
        </div>
      </div>
    </div>
  );
};
