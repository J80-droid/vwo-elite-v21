import React from "react";
import { Target } from "lucide-react";
import { CardWrapper } from "./CardWrapper";

interface ExamReadinessCardProps {
    grade: string;
    percentage: number;
}

export const ExamReadinessCard: React.FC<ExamReadinessCardProps> = ({ grade, percentage }) => (
    <CardWrapper
        neonColor="emerald"
        className="p-6 h-full flex flex-col justify-center"
        description="Je berekende voorbereidingsindex. Een 10.0 betekent dat je alle relevante examendomeinen op meesterniveau beheerst."
    >
        <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 rotate-12">
            <Target size={180} />
        </div>

        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Target size={14} />
            </div>
            <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                Exam Readiness
            </h3>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                {grade}
            </span>
            <span className="text-slate-600 text-xs font-bold">/ 10.0</span>
        </div>

        <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Progressie</span>
                <span className="text-emerald-400">{percentage}%</span>
            </div>
            <div className="w-full bg-slate-900/50 h-1 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    </CardWrapper>
);
