import { Flame } from "lucide-react";
import React from "react";
import { CardWrapper } from "./CardWrapper";

import { GYM_CATALOG } from "@features/math/ui/modules/gym/config/gymCatalog";
import { GymModuleConfig } from "@features/math/ui/modules/gym/types/config";
import { getSubjectColor } from "../theme";

interface KnowledgeMapProps {
    levelMap: Record<string, number>;
}

export const KnowledgeMap: React.FC<KnowledgeMapProps> = ({ levelMap }) => {
    return (
        <CardWrapper
            neonColor="indigo"
            className="p-10"
            description="Kenniskaart: Je meesterschap per onderwerp, gegroepeerd per vak. Hoe intenser de kleur, hoe hoger je bewezen niveau."
        >
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                        <Flame size={18} />
                    </div>
                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        Domain Mastery Knowledge Map
                    </h3>
                </div>
            </div>

            <div className="space-y-12">
                {Array.from(new Set(GYM_CATALOG.filter(m => !m.isSpecial).map(m => m.category))).sort().map(category => (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center gap-3 border-l-2 border-indigo-500/30 pl-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{category}</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                        </div>
                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 xl:grid-cols-12 gap-3">
                            {GYM_CATALOG.filter(m => !m.isSpecial && m.category === category).map((m: GymModuleConfig) => {
                                const lvl = levelMap[m.id] || 1;
                                const baseColor = getSubjectColor(m.category);
                                return (
                                    <div
                                        key={m.id}
                                        className="group/cell relative aspect-square flex items-center justify-center rounded-2xl transition-all duration-500 cursor-help border border-white/5 hover:border-white/20"
                                        style={{
                                            backgroundColor: `${baseColor}${Math.min(255, Math.round(lvl * 45)).toString(16).padStart(2, '0')}`,
                                            boxShadow: lvl > 3 ? `0 0 ${lvl * 4}px ${baseColor}40` : 'none'
                                        }}
                                    >
                                        <span className={`font-black text-sm tabular-nums transition-all duration-500 ${lvl > 3 ? 'text-white scale-110' : 'text-slate-500 group-hover/cell:text-slate-300'}`}>
                                            {lvl}
                                        </span>

                                        {/* Advanced Contextual Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl opacity-0 group-hover/cell:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-2xl scale-95 group-hover/cell:scale-100">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{category}</span>
                                                <span className="text-xs font-bold text-white">{m.title}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{ width: `${(lvl / 5) * 100}%` }} />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400">Lvl {lvl}</span>
                                                </div>
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                                        </div>

                                        {/* Simple Highlight Glow */}
                                        <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex justify-end gap-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full border border-slate-800" /> Newbie
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]" /> Elite Master
                </div>
            </div>
        </CardWrapper>
    );
};
