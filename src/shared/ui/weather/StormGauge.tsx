import { CloudLightning } from "lucide-react";
import React from "react";

export interface StormGaugeProps {
    cape?: number;
    lang: string;
}

export const StormGauge: React.FC<StormGaugeProps> = ({ cape }) => {
    if (cape === undefined) return null;

    return (
        <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-between min-h-[120px]">
            <div className="w-full flex justify-between items-start mb-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Storm</span>
                <CloudLightning size={12} className={cape > 500 ? "text-yellow-400 animate-pulse" : "text-slate-600"} />
            </div>
            <div className="relative w-full h-10 mt-1 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                <div className="absolute w-full h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 opacity-20" />
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_white] z-10"
                    style={{ left: `${Math.min((cape / 2000) * 100, 100)}%`, transition: "left 1s ease-out" }}
                />
                <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-white/10" />
                <div className="absolute top-0 bottom-0 left-2/4 w-[1px] bg-white/10" />
                <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-white/10" />
            </div>
            <span className="text-xs font-bold text-slate-300 mt-2">{cape} <span className="text-[9px] text-slate-500">J/kg</span></span>
        </div>
    );
};
