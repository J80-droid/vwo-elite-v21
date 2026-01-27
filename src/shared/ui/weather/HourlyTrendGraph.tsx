import { Waves } from "lucide-react";
import React from "react";

export interface HourlyTrendGraphProps {
    trend?: { time: number; temp: number }[];
    lang: string;
}

export const HourlyTrendGraph: React.FC<HourlyTrendGraphProps> = ({ trend }) => {
    if (!trend || trend.length === 0) return null;

    const values = trend.map((d) => d.temp);
    const min = Math.min(...values) - 2;
    const max = Math.max(...values) + 2;
    const range = max - min || 1;

    const points = trend.map((d, i) => {
        const x = (i / (trend.length - 1)) * 100;
        const y = 100 - ((d.temp - min) / range) * 80 - 10;
        return `${x},${y}`;
    }).join(" ");

    const areaPath = `M 0,100 ${points.split(" ").map((p) => `L ${p}`).join(" ")} L 100,100 Z`;

    return (
        <div className="col-span-3 bg-black/30 rounded-xl p-4 border border-white/5 relative overflow-hidden">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Waves size={12} className="text-blue-400" /> 6-Uurs Trend
            </h4>
            <div className="w-full h-14 relative flex items-end px-1">
                <svg className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#trendGradient)" vectorEffect="non-scaling-stroke" />
                    <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    {trend.map((d, i) => (
                        <circle key={i} cx={`${(i / (trend.length - 1)) * 100}%`} cy={`${100 - ((d.temp - min) / range) * 80 - 10}%`} r="2" fill="white" />
                    ))}
                </svg>
                <div className="absolute bottom-0 w-full flex justify-between text-[9px] text-slate-600 font-mono translate-y-full">
                    {trend.map((t) => <span key={t.time}>{t.time}u</span>)}
                </div>
            </div>
        </div>
    );
};
