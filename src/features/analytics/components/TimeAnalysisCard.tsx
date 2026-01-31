import React from "react";
import { Clock } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CardWrapper } from "./CardWrapper";

interface TimeAnalysisCardProps {
    data: { name: string; time: number }[];
}

export const TimeAnalysisCard: React.FC<TimeAnalysisCardProps> = ({ data }) => {
    const hasData = data.length > 0;
    const skeletonData = [
        { name: 'Onderwerp A', time: 120 },
        { name: 'Onderwerp B', time: 90 },
        { name: 'Onderwerp C', time: 60 },
    ];

    return (
        <CardWrapper
            neonColor="orange"
            className="p-8 h-full flex flex-col"
            description="Overzicht van de onderwerpen die je de meeste tijd kosten. Helpt je te focussen op efficiëntie voor het examen."
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                    <Clock size={16} />
                </div>
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    Time Analysis (Top 5)
                </h3>
            </div>

            <div className="flex-1 w-full relative">
                {!hasData && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px] rounded-xl">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Wachten op data...</p>
                    </div>
                )}
                <div className="flex-1 w-full min-h-[160px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={hasData ? data : skeletonData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                                width={80}
                                tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                formatter={(value?: number) => [`${(value || 0).toFixed(0)}s`, 'Tijd']}
                                contentStyle={{
                                    backgroundColor: 'rgba(2, 6, 23, 0.9)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    backdropFilter: 'blur(8px)',
                                    fontSize: '11px'
                                }}
                            />
                            <Bar
                                dataKey="time"
                                fill="#f97316"
                                radius={[0, 4, 4, 0]}
                                barSize={10}
                                className={hasData ? "drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" : "opacity-10"}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </CardWrapper>
    );
};
