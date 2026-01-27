import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { Highlighter } from "lucide-react";
import { useState } from "react";

import { AnnotationTrainer } from "./AnnotationTrainer";
import { PrimarySourceDecoder } from "./PrimarySourceDecoder";

export const AnalysisLab = () => {
  const { t } = useTranslations();
  const [activeTool, setActiveTool] = useState<"trainer" | "decoder">(
    "decoder",
  );
  useVoiceCoachContext(
    "PhilosophyLab",
    t(
      "philosophy.analysis.voice_coach",
      `Analyse Lab: Actief met ${activeTool}.`,
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
          onClick={() => setActiveTool("trainer")}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${activeTool === "trainer" ? "bg-violet-500/20 text-violet-300 border-violet-500/50" : "border-transparent text-slate-500"}`}
        >
          {t("philosophy.analysis.trainer_title", "Standard Trainer")}
        </button>
        <button
          onClick={() => setActiveTool("decoder")}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${activeTool === "decoder" ? "bg-amber-500/20 text-amber-300 border-amber-500/50" : "border-transparent text-slate-500"}`}
        >
          {t("philosophy.analysis.decoder_title", "Elite Decoder")}
        </button>
      </div>
      {activeTool === "trainer" ? (
        <AnnotationTrainer />
      ) : (
        <PrimarySourceDecoder />
      )}
    </div>
  );
};

export const AnalysisSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
        {t("philosophy.analysis.sidebar_title", "Analysis Toolkit")}
      </h3>
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
          <Highlighter size={18} />
        </div>
        <div className="text-left">
          <div className="text-sm font-bold text-white">
            {t("philosophy.analysis.xray_title", "X-Ray Mode")}
          </div>
          <div className="text-[10px] text-slate-500">
            {t("philosophy.analysis.xray_subtitle", "Contextuele Analyse")}
          </div>
        </div>
      </div>
    </div>
  );
};
