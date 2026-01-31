import React from "react";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CardWrapper } from "./CardWrapper";
import { TrajectoryPoint } from "../types";

interface TrajectoryCardProps {
    data: TrajectoryPoint[];
}

export const TrajectoryCard: React.FC<TrajectoryCardProps> = ({ data }) => {
    const hasData = data.length >= 2;
    // Skeleton data for empty state to show the grid
    const skeletonData = [
        { month: 'Jan', grade: 0 },
        { month: 'Feb', grade: 0 },
        { month: 'Mar', grade: 0 },
        { month: 'Apr', grade: 0 },
        { month: 'Mei', grade: 0 },
    ];

    return (
        <CardWrapper
            neonColor="cyan"
            className="p-8 h-full flex flex-col"
            description="Je gemiddelde cijferontwikkeling over de afgelopen maanden, inclusief een AI-voorspelling voor je volgende meetmoment."
        >
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <TrendingUp size={18} />
                </div>
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    Progressie Trend
                </h3>
            </div>

            <div className="flex-1 w-full min-h-[220px] relative">
                {!hasData && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px] rounded-xl">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Wachten op data...</p>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={hasData ? data : skeletonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                        />
                        <YAxis hide domain={[0, 10]} />
                        <Tooltip
                            cursor={{ stroke: '#22d3ee', strokeWidth: 1, strokeDasharray: '4 4' }}
                            formatter={(value?: number) => [`${(value || 0).toFixed(1)}`, 'Grade']}
                            contentStyle={{
                                backgroundColor: 'rgba(2, 6, 23, 0.8)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                backdropFilter: 'blur(8px)',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="grade"
                            stroke={hasData ? "#22d3ee" : "#334155"}
                            strokeWidth={3}
                            fill="url(#colorGrade)"
                            animationDuration={1500}
                        />
                        {hasData && (
                            <Area
                                type="monotone"
                                dataKey="projected"
                                stroke="#475569"
                                strokeDasharray="4 4"
                                strokeWidth={1}
                                fill="transparent"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </CardWrapper>
    );
};
