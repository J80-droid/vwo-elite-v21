import React from "react";
import { Target } from "lucide-react";
import { CardWrapper } from "./CardWrapper";
import { GYM_CATALOG } from "@features/math/ui/modules/gym/config/gymCatalog";

interface PointsToGainCardProps {
    data: { id: string; potential: number; acc: number; level: number }[];
}

export const PointsToGainCard: React.FC<PointsToGainCardProps> = ({ data }) => (
    <CardWrapper
        neonColor="rose"
        className="p-8 h-full flex flex-col"
        description="Priority Matrix: De onderwerpen waar je het makkelijkst punten kunt pakken. Dit zijn onderwerpen waar je nauwkeurigheid al hoog is, maar je syllabus dekking nog laag."
    >
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <Target size={18} />
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                Quick Wins (Priority Matrix)
            </h3>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 h-full">
                {data.length === 0 && (
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest text-center py-10 opacity-50">Data verzamelen...</p>
                )}
                {data.map((item, i) => {
                    const config = GYM_CATALOG.find(c => c.id === item.id);
                    return (
                        <div key={i} className="flex items-center gap-4 lg:gap-6 group/item p-4 rounded-3xl hover:bg-white/[0.02] transition-colors border border-white/0 hover:border-white/5">
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 lowercase tracking-tight mb-0.5 opacity-50">{config?.category}</span>
                                        <span className="text-[13px] font-black text-slate-200 group-hover/item:text-rose-400 transition-colors tracking-tight">{config?.title || item.id}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-rose-500 tabular-nums">+{Math.round(item.potential * 10)} XP</span>
                                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Potential</span>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 h-1.5">
                                    {[1, 2, 3, 4, 5].map(step => (
                                        <div
                                            key={step}
                                            className={`flex-1 rounded-full transition-all duration-700 ${step <= item.level ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-slate-800'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/50 border border-white/5 min-w-[50px]">
                                <span className="text-xs font-black text-slate-200 tabular-nums">
                                    {Math.round(item.acc * 100)}%
                                </span>
                                <span className="text-[7px] font-bold text-slate-600 uppercase">Acc.</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </CardWrapper>
);
