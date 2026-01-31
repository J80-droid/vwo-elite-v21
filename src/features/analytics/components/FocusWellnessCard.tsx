import React from "react";
import { Zap } from "lucide-react";
import { CardWrapper } from "./CardWrapper";
import { MentalState, WPMData } from "../types";

interface FocusWellnessCardProps {
    mental: MentalState;
    volume: number;
    wpm: WPMData;
}

export const FocusWellnessCard: React.FC<FocusWellnessCardProps> = ({ mental, volume, wpm }) => {
    const avgWPM = wpm.length > 0 ? Math.round(wpm.reduce((acc, curr) => acc + curr.wpm, 0) / wpm.length) : 0;

    return (
        <CardWrapper
            neonColor="emerald"
            className="p-6 h-full bg-emerald-500/[0.02]"
            description="Mentale staat en verwerkingssnelheid. WPM (Words Per Minute) is cruciaal voor taalexamens (VWO Elite target: 200+)."
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Zap size={14} />
                    </div>
                    <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">Mental & Speed</h3>
                </div>
                <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${mental.burnoutRisk === 'High' ? 'bg-rose-500/20 text-rose-400' :
                    mental.burnoutRisk === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                    Risk: {mental.burnoutRisk}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <span className="text-3xl font-black text-white tabular-nums tracking-tighter">{mental.focusScore}</span>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Focus Score</p>
                </div>
                {avgWPM > 0 && (
                    <div className="space-y-1">
                        <span className="text-3xl font-black text-emerald-400 tabular-nums tracking-tighter">{avgWPM}</span>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Avg WPM</p>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] font-bold text-slate-400">{volume} sessies / 24h</span>
                </div>
                {avgWPM > 0 && avgWPM < 180 && (
                    <span className="text-[8px] font-bold text-rose-400 uppercase animate-pulse">Low Speed Alert</span>
                )}
            </div>
        </CardWrapper>
    );
};
