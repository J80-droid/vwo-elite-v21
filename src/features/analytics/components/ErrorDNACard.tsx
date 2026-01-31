import React from "react";
import { Microscope } from "lucide-react";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer } from "recharts";
import { CardWrapper } from "./CardWrapper";
import { ErrorDNAItem } from "../types";

interface ErrorDNACardProps {
    data: ErrorDNAItem[];
}

export const ErrorDNACard: React.FC<ErrorDNACardProps> = ({ data }) => {
    const hasData = data.length > 0;
    const placeholderData = [{ name: 'Empty', value: 100, color: '#1e293b' }];

    return (
        <CardWrapper
            neonColor="rose"
            className="p-8 h-full flex flex-col"
            description="Analyse van je meest voorkomende fouttypes. Helpt je om patronen van slordigheid of gebrek aan conceptueel begrip te herkennen."
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <Microscope size={18} />
                </div>
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    Fouten DNA
                </h3>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 flex-1 relative">
                {!hasData && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/2 tracking-widest pl-32 md:pl-40 pt-4">
                        <p className="text-[10px] text-slate-600 uppercase font-black">Geen data</p>
                    </div>
                )}
                <div className="w-64 h-64 shrink-0 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <span className="text-slate-600 font-bold text-[10px] uppercase tracking-tighter">Errors</span>
                            <span className="text-slate-400 font-black text-sm">DNA</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <RechartsPieChart>
                            <Pie
                                data={hasData ? data : placeholderData}
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={hasData ? 4 : 0}
                                dataKey="value"
                                stroke="none"
                            >
                                {(hasData ? data : placeholderData).map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={!hasData ? "#1e293b" : entry.color}
                                        className={hasData ? "hover:opacity-80 transition-opacity cursor-pointer duration-300" : ""}
                                    />
                                ))}
                            </Pie>
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-6">
                    {hasData ? (
                        data.map((item) => (
                            <div key={item.name} className="flex items-center gap-4 group/row">
                                <div className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                                <span className="text-xs font-bold text-slate-400 flex-1 group-hover/row:text-slate-200 transition-colors">{item.name}</span>
                                <span className="text-xs font-black text-slate-500 tabular-nums">{item.value}%</span>
                                <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-700/50" style={{ width: `${item.value}%` }} />
                                </div>
                            </div>
                        ))
                    ) : (
                        [1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 opacity-10">
                                <div className="w-2 h-2 rounded-full bg-slate-700" />
                                <div className="h-3 w-32 bg-slate-800 rounded" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </CardWrapper>
    );
};
