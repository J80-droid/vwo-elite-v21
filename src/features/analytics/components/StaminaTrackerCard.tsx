import React from "react";
import { Activity } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CardWrapper } from "./CardWrapper";

interface StaminaTrackerCardProps {
    data: { index: number; accuracy: number }[];
}

export const StaminaTrackerCard: React.FC<StaminaTrackerCardProps> = ({ data }) => {
    const hasData = data.length > 0;
    const skeletonData = [
        { index: 1, accuracy: 90 }, { index: 5, accuracy: 85 },
        { index: 10, accuracy: 80 }, { index: 15, accuracy: 70 }
    ];

    return (
        <CardWrapper
            neonColor="emerald"
            className="p-8 h-full flex flex-col"
            description="Analyseer je nauwkeurigheid over de lengte van een sessie. Cruciaal om te ontdekken wanneer vermoeidheid je fouten laat maken."
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Activity size={16} />
                </div>
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    Stamina & Focus
                </h3>
            </div>

            <div className="flex-1 w-full relative">
                {!hasData && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px] rounded-xl">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Snelheids data nodig...</p>
                    </div>
                )}
                <div className="flex-1 w-full min-h-[120px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={hasData ? data : skeletonData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" opacity={0.3} vertical={false} />
                            <XAxis dataKey="index" hide />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip
                                cursor={{ stroke: '#059669', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(2, 6, 23, 0.9)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    backdropFilter: 'blur(8px)',
                                    fontSize: '11px'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="accuracy"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#020617' }}
                                className={hasData ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "opacity-10"}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </CardWrapper>
    );
};
