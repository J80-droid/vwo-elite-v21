import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { Microscope } from "lucide-react";
import { useState } from "react";

import { PerspectiveShifter } from "./PerspectiveShifter";
import { ScienceTimeline } from "./ScienceTimeline";

export const ScienceLab = () => {
  const { t } = useTranslations();
  const [activeTool, setActiveTool] = useState<"shifter" | "timeline">(
    "shifter",
  );
  useVoiceCoachContext(
    "PhilosophyLab",
    t("philosophy.science_timeline.voice_coach", { tool: activeTool }),
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
          onClick={() => setActiveTool("shifter")}
          className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest border ${activeTool === "shifter" ? "bg-teal-500/20 text-teal-300 border-teal-500/50" : "border-transparent text-slate-500"}`}
        >
          {t("philosophy.science_timeline.sidebar.shifter_title")}
        </button>
        <button
          onClick={() => setActiveTool("timeline")}
          className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest border ${activeTool === "timeline" ? "bg-amber-500/20 text-amber-300 border-amber-500/50" : "border-transparent text-slate-500"}`}
        >
          {t("philosophy.science_timeline.sidebar.revolutie_title")}
        </button>
      </div>
      <div className="relative z-10 w-full h-full">
        {activeTool === "shifter" && <PerspectiveShifter />}
        {activeTool === "timeline" && <ScienceTimeline />}
      </div>
    </div>
  );
};

export const ScienceSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
        {t(
          "philosophy.science_timeline.sidebar.epistemology_tools",
          "Epistemologie Tools",
        )}
      </h3>
      <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
          <Microscope size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-white">
            {t("philosophy.science_timeline.sidebar.shifter_title")}
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {t("philosophy.science_timeline.sidebar.shifter_subtitle")}
          </div>
        </div>
      </div>
    </div>
  );
};
