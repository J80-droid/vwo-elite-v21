import React, { useContext } from "react";
import { AnalyticsUIContext } from "../context/AnalyticsContext";
import { getNeonGlow } from "../theme";

interface CardWrapperProps {
    children: React.ReactNode;
    title?: string; // Optional title if needed
    className?: string;
    description?: string;
    neonColor?: string; // 'amber', 'blue', 'purple', etc.
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
    children,
    className = "",
    description,
    neonColor = "indigo"
}) => {
    const { showTooltips } = useContext(AnalyticsUIContext);

    return (
        <div
            className={`relative bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:border-white/10 group ${className}`}
            style={{
                boxShadow: getNeonGlow(neonColor)
            }}
        >
            {description && showTooltips && (
                <div className="absolute top-6 right-6 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0 pointer-events-none">
                    <div className="bg-slate-900/95 shadow-2xl border border-white/10 rounded-xl p-3 max-w-[200px] backdrop-blur-xl">
                        <p className="text-[10px] font-bold text-slate-300 leading-relaxed uppercase tracking-tighter mb-1 border-b border-white/5 pb-1">Inzicht</p>
                        <p className="text-[9px] font-medium text-slate-400 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
            )}

            {children}
        </div>
    );
};
