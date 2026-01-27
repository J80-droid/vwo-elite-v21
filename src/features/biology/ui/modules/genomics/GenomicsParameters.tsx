import { useTranslations } from "@shared/hooks/useTranslations";
import { Activity, Beaker, FileCode, Zap } from "lucide-react";
import React, { useMemo } from "react";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultGenomicsState, GenomicsState } from "../../../types";
import { calculateTm } from "../../../utils/bioUtils";

export const GenomicsParameters: React.FC = () => {
  const [state] = useModuleState<GenomicsState>(
    "genomics",
    defaultGenomicsState,
  );
  const { t } = useTranslations();

  const gcContent = useMemo(() => {
    const cleanSeq = state.sequence.toUpperCase().replace(/[^ATCG]/g, "");
    if (cleanSeq.length === 0) return 0;
    const gc = (cleanSeq.match(/[GC]/g) || []).length;
    return (gc / cleanSeq.length) * 100;
  }, [state.sequence]);

  const tm = useMemo(() => calculateTm(state.sequence), [state.sequence]);

  const stats = [
    {
      label: t("biology.genomics.parameters.sequence_length"),
      value: `${state.sequence.length} bp`,
      icon: FileCode,
      color: "text-cyan-400",
    },
    {
      label: t("biology.genomics.parameters.gc_content"),
      value: `${gcContent.toFixed(1)}%`,
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      label: t("biology.genomics.parameters.melting_temp"),
      value: `${tm.toFixed(1)}°C`,
      icon: Zap,
      color: "text-amber-400",
    },
    {
      label: t("biology.genomics.parameters.reading_frame"),
      value: `${t("biology.genomics.parameters.reading_frame")} ${((state.selectedIndex || 0) % 3) + 1}`,
      icon: Beaker,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="p-6 grid grid-cols-2 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-slate-500 uppercase text-[9px] font-black tracking-widest">
            <stat.icon size={12} className={stat.color} />
            {stat.label}
          </div>
          <div className="text-xl font-mono font-bold text-white uppercase tabular-nums">
            {stat.value}
          </div>
        </div>
      ))}

      <div className="col-span-2 mt-4 bg-obsidian-950/50 border border-white/5 rounded-xl p-4">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          {t("biology.genomics.parameters.status_monitor")}
        </h5>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${state.viewMode === "pdb" ? "bg-purple-500 animate-pulse" : "bg-cyan-500 animate-pulse"}`}
            />
            <span className="text-[10px] font-bold text-slate-300 uppercase">
              {state.viewMode} MODE
            </span>
          </div>
          {state.missionTarget && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-tight italic">
                {t("biology.genomics.parameters.active_mission")}:{" "}
                {state.missionTarget}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
