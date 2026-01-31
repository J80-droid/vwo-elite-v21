import React from "react";
import { BookOpen } from "lucide-react";
import { CardWrapper } from "./CardWrapper";
import { SyllabusItem } from "../types";

interface SyllabusCardProps {
    data: SyllabusItem[];
}

export const SyllabusCard: React.FC<SyllabusCardProps> = ({ data }) => (
    <CardWrapper
        neonColor="indigo"
        className="p-8 flex flex-col"
        description="Strategisch overzicht van je voortgang per officieel examendomein. Groen betekent examenklaar."
    >
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <BookOpen size={18} />
                </div>
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    Syllabus Dekking
                </h3>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase">Target:</span>
                <span className="text-[10px] font-black text-indigo-400 tabular-nums">100% Mastered</span>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-6 gap-y-6">
            {data.length === 0 ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="opacity-20 animate-pulse">
                        <div className="flex justify-between mb-1">
                            <div className="w-12 h-2 bg-slate-800 rounded" />
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full" />
                    </div>
                ))
            ) : (
                data.map((d) => (
                    <div key={d.id} className="group/item">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-[8px] text-indigo-500 font-bold bg-indigo-500/5 px-1 py-0.5 rounded border border-indigo-500/10 shrink-0">{d.id}</span>
                                <span className="text-[10px] font-bold text-slate-400 group-hover/item:text-white transition-colors truncate">{d.name}</span>
                            </div>
                            {d.weight >= 8 && (
                                <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                            )}
                        </div>
                        <div className="w-full bg-slate-900/50 h-1 rounded-full overflow-hidden border border-white/5 relative">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.3)] ${d.coverage < 55 ? 'bg-rose-500' : d.coverage < 75 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                style={{ width: `${d.coverage}%` }}
                            />
                        </div>
                    </div>
                ))
            )}
        </div>
    </CardWrapper>
);
