import React from "react";

import { WeatherIcon } from "./WeatherIcon";

export interface ForecastDayProps {
    day: {
        date: string;
        maxTemp: number;
        minTemp: number;
        slots: {
            night: { icon: string };
            morning: { icon: string };
            afternoon: { icon: string };
            evening: { icon: string };
        };
    };
    lang: string;
}

export const ForecastDay: React.FC<ForecastDayProps> = ({ day, lang }) => {
    const formatDay = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date().toISOString().split("T")[0];
        const locales: Record<string, string> = { nl: "nl-NL", fr: "fr-FR", es: "es-ES", en: "en-US" };
        const locale = locales[lang] || "en-US";
        if (dateStr === today) return lang === "nl" ? "nu" : "now";
        return date.toLocaleDateString(locale, { weekday: "short" });
    };

    return (
        <div className="grid grid-cols-[1.5fr_repeat(4,1fr)_auto] items-center gap-2">
            <span className="text-xs font-bold text-slate-400 capitalize">
                {formatDay(day.date)}
            </span>

            <div className="flex justify-center"><WeatherIcon iconName={day.slots.night.icon} size={14} /></div>
            <div className="flex justify-center"><WeatherIcon iconName={day.slots.morning.icon} size={14} /></div>
            <div className="flex justify-center"><WeatherIcon iconName={day.slots.afternoon.icon} size={14} /></div>
            <div className="flex justify-center"><WeatherIcon iconName={day.slots.evening.icon} size={14} /></div>

            <div className="flex flex-col items-end pl-2">
                <span className="text-[10px] font-mono font-bold text-orange-400 leading-none">
                    {day.maxTemp}°
                </span>
                <span className="text-[9px] font-mono text-cyan-500 opacity-70">
                    {day.minTemp}°
                </span>
            </div>
        </div>
    );
};
