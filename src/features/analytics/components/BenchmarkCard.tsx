import React from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CardWrapper } from "./CardWrapper";
import { BenchmarkItem } from "../types";

interface BenchmarkCardProps {
    data: BenchmarkItem[];
}

export const BenchmarkCard: React.FC<BenchmarkCardProps> = ({ data }) => (
    <CardWrapper
        neonColor="amber"
        className="p-8 h-full flex flex-col"
        description="Elite Standard Gap: Hoe verhoudt jouw prestatie zich tot de 100% Elite standard? Overbrug de gaten in nauwkeurigheid, snelheid en dekking."
    >
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <TrendingUp size={16} />
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                Elite Standard Gap
            </h3>
        </div>

        <div className="flex-1 w-full min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={data} layout="vertical" margin={{ left: -20, right: 20 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" opacity={0.3} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        formatter={(value: number | undefined, name: string | undefined) => [
                            <span style={{ color: name === 'elite' ? '#94a3b8' : '#f59e0b', fontWeight: 'bold' }}>
                                {(value || 0).toFixed(1)}%
                            </span>,
                            <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900' }}>{name === 'elite' ? 'Elite Target' : 'Jouw Score'}</span>
                        ]}
                        contentStyle={{
                            backgroundColor: 'rgba(2, 6, 23, 0.95)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(12px)',
                            padding: '10px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                    />
                    <Bar dataKey="user" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
                    <Bar dataKey="elite" fill="#334155" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded bg-amber-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase">You</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded bg-slate-800" />
                    <span className="text-[9px] font-black text-slate-500 uppercase">Elite Target</span>
                </div>
            </div>
        </div>
    </CardWrapper>
);
