import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { Trophy } from "lucide-react";

import { BattleArena } from "./BattleArena";

export const BattleLab = () => {
  const { t } = useTranslations();
  useVoiceCoachContext(
    "PhilosophyLab",
    t(
      "philosophy.battle.voice_coach",
      "Welkom bij de Begrippen Battle. Test je kennis in realtime.",
    ),
    { tool: "battle" },
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <h1 className="text-[15rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>
      <div className="relative z-10 w-full h-full">
        <BattleArena />
      </div>
    </div>
  );
};

export const BattleSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
        {t("philosophy.battle.sidebar_title", "Battle Stats")}
      </h3>
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
          <Trophy size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-white">
            {t("philosophy.battle.highscore_title", "Daily Highscore")}
          </div>
          <div className="text-[10px] text-slate-500">12.400 PTS</div>
        </div>
      </div>
    </div>
  );
};
