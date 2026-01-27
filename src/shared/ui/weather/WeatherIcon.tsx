import {
Cloud,
CloudLightning,
CloudMoon,     CloudRain, CloudSnow, CloudSun, Moon,     Sun} from "lucide-react";
import React from "react";

export interface WeatherIconProps {
    iconName: string;
    size?: number;
    className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ iconName, size = 16, className = "" }) => {
    switch (iconName) {
        case "Sun":
            return <Sun size={size} className={`text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)] ${className}`} />;
        case "Moon":
            return <Moon size={size} className={`text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.4)] ${className}`} />;
        case "CloudSun":
            return <CloudSun size={size} className={`text-amber-400 ${className}`} />;
        case "CloudMoon":
            return <CloudMoon size={size} className={`text-slate-400 ${className}`} />;
        case "Cloud":
            return <Cloud size={size} className={`text-slate-400 ${className}`} />;
        case "CloudRain":
            return <CloudRain size={size} className={`text-blue-400 animate-pulse ${className}`} />;
        case "CloudSnow":
            return <CloudSnow size={size} className={`text-cyan-100 ${className}`} />;
        case "CloudLightning":
            return <CloudLightning size={size} className={`text-purple-400 animate-bounce ${className}`} />;
        default:
            return <Cloud size={size} className={`text-slate-400 ${className}`} />;
    }
};
