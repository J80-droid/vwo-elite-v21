import { SUBJECT_THEME_CONFIG } from "@features/library/types/library.types";
import { useTranslations } from "@shared/hooks/useTranslations";
import { TypewriterText } from "@shared/ui/TypewriterText";
import { AlertTriangle, TrendingUp } from "lucide-react";
import React from "react";

import { MasteryRing } from "../MasteryRing";

interface SubjectMetricsProps {
    themeKey: string;
    masteryValue: number;
    weakTopicsValue: string[];
}

export const SubjectMetrics: React.FC<SubjectMetricsProps> = ({
    themeKey,
    masteryValue,
    weakTopicsValue,
}) => {
    const { t } = useTranslations();
    const theme = SUBJECT_THEME_CONFIG[themeKey] || SUBJECT_THEME_CONFIG["default"]!;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
            <div className="bg-[#0c1221] border border-white/10 p-6 rounded-[24px] relative overflow-hidden group shadow-xl flex flex-col items-center justify-center min-h-[200px]">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp size={120} />
                </div>
                <div className="w-full flex justify-between items-start mb-2 z-10">
                    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        {t("library.stats.metacognition")}
                    </h3>
                    <div
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase ${masteryValue > 75
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-blue-500/10 text-blue-400"
                            }`}
                    >
                        {masteryValue > 80
                            ? t("library.stats.levels.elite")
                            : t("library.stats.levels.progressing")}
                    </div>
                </div>
                <div className="relative z-10 py-2">
                    <MasteryRing
                        percentage={masteryValue}
                        size={140}
                        strokeWidth={12}
                        theme={
                            masteryValue > 75
                                ? "text-emerald-400"
                                : masteryValue > 50
                                    ? theme.text
                                    : "text-amber-400"
                        }
                        trackColor="text-white/5"
                    />
                </div>
                <span className="text-slate-600 text-[10px] font-bold uppercase tracking-tight relative z-10">
                    {t("library.stats.mastery_label")}
                </span>
            </div>

            <div className="bg-[#0c1221] border border-amber-500/20 p-6 rounded-[24px] md:col-span-2 flex items-start gap-6 shadow-2xl hover:border-amber-500/40 transition-colors">
                <div className="bg-amber-500/10 p-4 rounded-2xl text-amber-500 shrink-0 shadow-inner">
                    <AlertTriangle size={32} />
                </div>
                <div>
                    <h3 className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        {t("library.stats.focus_advice")}
                    </h3>
                    <div className="text-slate-300 text-sm leading-relaxed font-medium min-h-[60px]">
                        {weakTopicsValue.length > 0 ? (
                            <TypewriterText
                                text={t("library.advice.weak_topics", {
                                    topic: weakTopicsValue[0],
                                })}
                                speed={15}
                            />
                        ) : (
                            <TypewriterText text={t("library.advice.stable")} speed={15} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
