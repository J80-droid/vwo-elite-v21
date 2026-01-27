import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { ScanFace } from "lucide-react";
import { useState } from "react";

import { SFDecoder } from "./SFDecoder";
import { TechnoAnthropologyLab } from "./TechnoAnthropologyLab";

export const TechnoLab = () => {
  const { t } = useTranslations();
  const [activeTool, setActiveTool] = useState<"anthropology" | "sf">(
    "anthropology",
  );
  useVoiceCoachContext(
    "PhilosophyLab",
    t(
      "philosophy.techno_anthropology.voice_coach",
      `Techno-Human Lab: Actief met tool ${activeTool}. Focus op 2025 examenthema.`,
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
          onClick={() => setActiveTool("anthropology")}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${activeTool === "anthropology" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50" : "border-transparent text-slate-500"}`}
        >
          {t("philosophy.techno_anthropology.sidebar.anthropology")}
        </button>
        <button
          onClick={() => setActiveTool("sf")}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${activeTool === "sf" ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50" : "border-transparent text-slate-500"}`}
        >
          {t("philosophy.techno_anthropology.sidebar.sf_decoder")}
        </button>
      </div>
      <div className="relative z-10 w-full h-full">
        {activeTool === "anthropology" && <TechnoAnthropologyLab />}
        {activeTool === "sf" && <SFDecoder />}
      </div>
    </div>
  );
};

export const TechnoSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
        {t(
          "philosophy.techno_anthropology.sidebar.tools_title",
          "Post-Human Tools",
        )}
      </h3>
      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
          <ScanFace size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-white">
            {t("philosophy.techno_anthropology.sidebar.anthropology")}
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {t(
              "philosophy.techno_anthropology.sidebar.cyborg_index",
              "Cyborg Index",
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
