import React from "react";
import { TrendingUp } from "lucide-react";
import { CardWrapper } from "./CardWrapper";

interface PredictedGradeCardProps {
    grade: number;
    percentile: number;
    breakdown: { accuracy: number; coverage: number; stamina: number };
}

export const PredictedGradeCard: React.FC<PredictedGradeCardProps> = ({ grade, percentile, breakdown }) => (
    <CardWrapper
        neonColor="indigo"
        className="p-6 h-full flex flex-col justify-center relative bg-indigo-500/[0.02]"
        description="Je voorspelde eindexamencijfer. Berekend op basis van nauwkeurigheid (50%), syllabus dekking (30%) en stamina (20%)."
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] pointer-events-none" />

        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <TrendingUp size={14} />
            </div>
            <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                Predicted Grade
            </h3>
        </div>

        <div className="flex items-end justify-between gap-3 mb-4">
            <div className="flex items-end gap-3">
                <span className="text-5xl font-black text-white leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    {grade.toFixed(1)}
                </span>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest pb-1 border-l border-white/10 pl-3">
                    Target: <span className="text-indigo-400">8.5+</span>
                </span>
            </div>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] font-black text-emerald-400 tabular-nums">Top {100 - percentile}%</span>
                </div>
                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">National Percentile</span>
            </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider">
                <span className="text-slate-500">Accuracy</span>
                <span className="text-indigo-400">{(breakdown.accuracy * 10).toFixed(0)}%</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500/40 rounded-full" style={{ width: `${breakdown.accuracy * 10}%` }} />
            </div>
        </div>
    </CardWrapper>
);
