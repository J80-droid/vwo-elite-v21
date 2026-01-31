import React from "react";
import { Brain } from "lucide-react";
import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { CardWrapper } from "./CardWrapper";
import { ConfidencePoint } from "../types";

interface ConfidenceMatrixCardProps {
    data: ConfidencePoint[];
}

export const ConfidenceMatrixCard: React.FC<ConfidenceMatrixCardProps> = ({ data }) => {
    const hasData = data.length > 0;
    const skeletonPoints = [
        { conf: 2, correct: 0.2, size: 100, name: 'Empty' },
        { conf: 5, correct: 0.5, size: 80, name: 'Empty' },
        { conf: 8, correct: 0.8, size: 120, name: 'Empty' },
    ];

    return (
        <CardWrapper
            neonColor="purple"
            className="p-8 h-full flex flex-col"
            description="Visualisatie van je zelfvertrouwen versus je werkelijke prestatie. Identificeer gaten in je kennis of overmoed."
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Brain size={18} />
                </div>
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    Confidence Matrix
                </h3>
            </div>

            <div className="flex-1 w-full flex flex-col relative">
                {!hasData && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/10 tracking-[0.2em]">
                        <p className="text-[10px] text-slate-600 uppercase font-black">Wachten op inzichten...</p>
                    </div>
                )}
                <div className="flex-1 w-full min-h-[350px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" opacity={0.3} vertical={false} />
                            <XAxis type="number" dataKey="conf" domain={[0, 10]} hide />
                            <YAxis type="number" dataKey="correct" domain={[0, 1]} hide />
                            <ZAxis type="number" dataKey="size" range={[60, 400]} />
                            <Tooltip
                                cursor={{ stroke: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(2, 6, 23, 0.9)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    backdropFilter: 'blur(8px)',
                                    fontSize: '11px'
                                }}
                            />
                            <Scatter name="Zones" data={hasData ? data : skeletonPoints}>
                                {(hasData ? data : skeletonPoints).map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={!hasData ? "#1e293b" : entry.name === "Master Zone" ? "#10b981" : entry.name === "Danger Zone" ? "#f43f5e" : "#f59e0b"}
                                        className={hasData ? "drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" : "opacity-20"}
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest pt-4 px-2">
                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rose-500 opacity-30" /> Onzeker</span>
                    <span className="flex items-center gap-1.5">Zeker <div className="w-1 h-1 rounded-full bg-emerald-500 opacity-30" /></span>
                </div>
            </div>
        </CardWrapper>
    );
};
