import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { Globe2 } from "lucide-react";

import { IdentityPrism } from "./IdentityPrism";

export const SocietyLab = () => {
  const { t } = useTranslations();
  useVoiceCoachContext(
    "PhilosophyLab",
    t(
      "philosophy.society.voice_coach",
      "Wie ben jij in de digitale samenleving?",
    ),
    { tool: "society" },
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <Globe2 className="w-[30rem] h-[30rem] text-white" />
      </div>
      <div className="relative z-10 w-full h-full">
        <IdentityPrism />
      </div>
    </div>
  );
};

export const SocietySidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="flex-1 flex flex-col pt-0 p-6 space-y-6 overflow-y-auto">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
        {t("philosophy.identity_prism.sidebar.tools_title", "Identity Tools")}
      </h3>
      <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
          <Globe2 size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-white">
            {t("philosophy.identity_prism.sidebar.prism_title")}
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {t("philosophy.identity_prism.sidebar.prism_subtitle")}
          </div>
        </div>
      </div>
    </div>
  );
};
