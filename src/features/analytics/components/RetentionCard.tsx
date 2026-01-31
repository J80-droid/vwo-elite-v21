import React from "react";
import { History as HistoryIcon } from "lucide-react";
import { CardWrapper } from "./CardWrapper";
import { RetentionData } from "../types";

interface RetentionCardProps {
    data: RetentionData;
}

export const RetentionCard: React.FC<RetentionCardProps> = ({ data }) => {
    return (
        <CardWrapper
            neonColor="emerald"
            className="p-8 h-full flex flex-col"
            description="Geheugen & Retentie: Hoe goed blijven de onderwerpen in je langetermijngeheugen zitten? Gebaseerd op de Forgetting Curve en het Leitner systeem."
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <HistoryIcon size={16} />
                </div>
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    Memory Strength
                </h3>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <span className="text-4xl font-black text-white tracking-tighter">
                            {data.overall}%
                        </span>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global Retention</p>
                    </div>
                    <div className={`p-3 rounded-2xl border ${data.overall > 70 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                        {data.overall > 80 ? 'Elite' : data.overall > 60 ? 'Stabiel' : 'Kritiek'}
                    </div>
                </div>

                <div className="space-y-4">
                    {data.segments.map((s, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                <span className="text-slate-400">{s.label}</span>
                                <span className="text-slate-500">{s.percentage}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${s.percentage}%`,
                                        backgroundColor: s.color,
                                        boxShadow: `0 0 10px ${s.color}40`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </CardWrapper>
    );
};
