import { Moon,Sun } from "lucide-react";
import React from "react";

export interface SunPathGraphProps {
    sunrise?: string;
    sunset?: string;
    lang: string;
}

export const SunPathGraph: React.FC<SunPathGraphProps> = ({ sunrise, sunset, lang }) => {
    const parseTime = (tStr: string) => {
        const parts = tStr.split(":").map(Number);
        const h = parts[0] ?? 0;
        const m = parts[1] ?? 0;
        return h * 60 + m;
    };

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const sunriseMinutes = sunrise ? parseTime(sunrise) : 480;
    const sunsetMinutes = sunset ? parseTime(sunset) : 1020;

    const isNight = currentMinutes < sunriseMinutes || currentMinutes > sunsetMinutes;
    const themeColor = isNight ? "#38bdf8" : "#FF7F27";
    const label = isNight
        ? (lang === "nl" ? "Zonsopkomst" : "Sunrise")
        : (lang === "nl" ? "Zonsondergang" : "Sunset");
    const timeValue = isNight ? sunrise : sunset;

    let cx = 190;
    let cy = 62;

    if (sunrise && sunset) {
        if (!isNight) {
            const t = (currentMinutes - sunriseMinutes) / (sunsetMinutes - sunriseMinutes);
            cx = Math.pow(1 - t, 2) * 10 + 2 * (1 - t) * t * 190 + Math.pow(t, 2) * 370;
            cy = Math.pow(1 - t, 2) * 85 + 2 * (1 - t) * t * 10 + Math.pow(t, 2) * 85;
        } else {
            cx = 10;
            cy = 85;
        }
    }

    return (
        <div className="col-span-2 bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col items-center text-[#EFE5C6] relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-2 font-bold tracking-widest self-start" style={{ color: themeColor }}>
                {isNight ? <Moon size={16} /> : <Sun size={16} />}
                <span className="text-[10px] uppercase">{label}</span>
            </div>

            <div className="text-4xl font-bold mb-2 self-start" style={{
                color: isNight ? "#e2e8f0" : "#EFE5C6",
                filter: `drop-shadow(0 0 8px ${isNight ? "rgba(56, 189, 248, 0.3)" : "rgba(255, 127, 39, 0.3)"})`
            }}>
                {timeValue || "--:--"}
            </div>

            <div className="w-full h-16 relative mb-1">
                <svg width="100%" height="100%" viewBox="0 0 380 100">
                    <line x1="0" y1="85" x2="380" y2="85" stroke={isNight ? "#1e293b" : "#8B4513"} strokeWidth="2" opacity="0.6" />
                    <path d="M 10 85 Q 190 10 370 85" stroke={themeColor} strokeWidth="4" fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${themeColor})` }} />
                    <circle cx={cx} cy={cy} r="8" fill={isNight ? "#f1f5f9" : "#FFD700"} style={{ filter: `drop-shadow(0 0 10px ${isNight ? "#cbd5e1" : "#FFD700"})` }} className="transition-all duration-1000" />
                </svg>
            </div>
        </div>
    );
};
