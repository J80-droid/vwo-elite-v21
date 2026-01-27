import React from "react";

export interface WeatherMetricProps {
    label: string;
    value: string | number;
    unit?: string;
    icon: React.ReactNode;
    borderBottom?: boolean;
}

export const WeatherMetric: React.FC<WeatherMetricProps> = ({ label, value, unit, icon, borderBottom = true }) => {
    return (
        <div className={`flex items-center gap-4 py-3 ${borderBottom ? "border-b border-white/5" : ""}`}>
            <div className="text-slate-400">{icon}</div>
            <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    {label}
                </span>
                <span className="text-2xl font-black text-white leading-none">
                    {value}{unit && <span className="text-sm font-normal ml-0.5">{unit}</span>}
                </span>
            </div>
        </div>
    );
};
