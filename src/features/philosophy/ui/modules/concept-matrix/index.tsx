import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { Layers } from "lucide-react";

import { ConceptMatrix } from "./ConceptMatrix";

export { ConceptMatrix as ConceptMatrixStage };

export const ConceptMatrixLab = () => {
  const { t } = useTranslations();
  useVoiceCoachContext(
    "PhilosophyLab",
    t(
      "philosophy.concept_matrix.voice_coach",
      "Welkom in de Concept Matrix. Verken de verbindingen tussen filosofen en hun kernbegrippen in 3D.",
    ),
    { tool: "matrix" },
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <h1 className="text-[15rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>
      <div className="relative z-10 w-full h-full">
        <ConceptMatrix />
      </div>
    </div>
  );
};

export const ConceptMatrixSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
          {t("philosophy.concept_matrix.navigation_title", "Navigatie Gids")}
        </h3>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Layers size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {t("philosophy.concept_matrix.interaction_title", "Interactie")}
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                {t(
                  "philosophy.concept_matrix.interaction_desc",
                  "Linkermuisknop om te draaien, rechter om te pannen.",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
