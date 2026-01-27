import React from "react";

export interface AQIRingProps {
    aqi?: number;
    lang: string;
}

export const AQIRing: React.FC<AQIRingProps> = ({ aqi, lang }) => {
    if (aqi === undefined) return null;

    const color = aqi < 20 ? "#4ade80" : aqi < 40 ? "#facc15" : aqi < 60 ? "#fb923c" : "#ef4444";
    const label = aqi < 20
        ? (lang === "nl" ? "Uitstekend" : "Good")
        : aqi < 40
            ? (lang === "nl" ? "Redelijk" : "Fair")
            : (lang === "nl" ? "Matig" : "Moderate");

    return (
        <div className="bg-black/30 rounded-xl p-3 border border-white/5 relative flex flex-col items-center justify-between min-h-[120px]">
            <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">AQI</span>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center mt-3 group">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#334155" strokeWidth="5" fill="none" />
                    <circle
                        cx="32" cy="32" r="28" stroke={color}
                        strokeWidth="5" fill="none" strokeDasharray="176"
                        strokeDashoffset={176 - (Math.min(aqi, 100) / 100) * 176}
                        strokeLinecap="round"
                        className="transition-all duration-1000 group-hover:stroke-[6] group-hover:drop-shadow-[0_0_8px_currentColor]"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-white">{aqi}</span>
                    <span className="text-[7px] uppercase font-bold text-slate-400">PM2.5</span>
                </div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{label}</div>
        </div>
    );
};
