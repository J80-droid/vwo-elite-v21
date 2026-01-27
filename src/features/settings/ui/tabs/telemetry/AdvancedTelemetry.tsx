import { useAIAnalyticsStore } from "@shared/model/aiStatusStore";
import { useMcpToolStore } from "@shared/model/mcpToolStore";
import { motion } from "framer-motion";
import {
    Activity,
    Globe,
    TrendingUp,
    Wrench,
} from "lucide-react";
import React from "react";
import {
    Area,
    AreaChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

import { EliteCard } from "../../components/EliteCard";
import { TaskQueueVisualizer } from "../../components/TaskQueueVisualizer";

export const AdvancedTelemetry: React.FC = () => {
    const { events, getAggregatedStats } = useAIAnalyticsStore();
    const { tools } = useMcpToolStore();

    const stats = getAggregatedStats
        ? getAggregatedStats()
        : { totalTokens: 0, totalRequests: 0, avgLatency: 0, avgTps: 0, errorRate: 0 };

    // Real Cost Aggregation
    const totalCost = events.reduce((acc, e) => acc + (e.cost || 0), 0);

    const categoryUsage = tools.reduce((acc: Record<string, number>, tool) => {
        const cat = tool.category || "General";
        acc[cat] = (acc[cat] || 0) + tool.usageCount;
        return acc;
    }, {});

    const pieData = Object.entries(categoryUsage).map(([name, value]) => ({
        name,
        value,
    }));

    const COLORS = [
        "#06b6d4",
        "#10b981",
        "#8b5cf6",
        "#f59e0b",
        "#f43f5e",
        "#3b82f6",
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* TASK EXECUTION VISUALIZER */}
            <TaskQueueVisualizer />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[800px]">
                {/* LEFT: Live Stream & Breakdown */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                    <EliteCard
                        className="h-1/2 flex flex-col border-white/10"
                        glowColor="orange"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-white uppercase text-xs tracking-widest">
                                    Live Token Stream
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono">
                                    Real-time inference telemetry
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl text-orange-400 font-mono tracking-tighter">
                                    {stats.totalRequests}
                                </div>
                                <div className="text-[10px] text-slate-600 uppercase font-bold">
                                    Total Operations
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-0 bg-black/20 rounded-xl overflow-hidden border border-white/5">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={[...(events || [])]
                                        .reverse()
                                        .slice(0, 50)
                                        .map((e, i) => ({ i, tokens: e.tokens.total }))}
                                >
                                    <defs>
                                        <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#09090b",
                                            borderColor: "#27272a",
                                            color: "#fff",
                                            fontSize: "10px",
                                        }}
                                        itemStyle={{ color: "#fb923c" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="tokens"
                                        stroke="#f97316"
                                        strokeWidth={2}
                                        fill="url(#colorTokens)"
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </EliteCard>

                    <div className="h-1/2 grid grid-cols-2 gap-6">
                        <EliteCard glowColor="cyan" className="flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-tighter">
                                Tools by Category
                            </h3>
                            <div className="flex-1 flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((_entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#09090b",
                                                border: "none",
                                                borderRadius: "8px",
                                            }}
                                            itemStyle={{ fontSize: "10px" }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <Wrench size={24} className="text-slate-700 mb-1" />
                                    <span className="text-[10px] font-mono text-slate-500">
                                        Registry
                                    </span>
                                </div>
                            </div>
                        </EliteCard>

                        <EliteCard glowColor="violet" className="flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                    Recent Calls
                                </h3>
                                <Activity
                                    size={12}
                                    className="text-violet-500 animate-pulse"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                {tools
                                    .filter((t) => t.usageCount > 0)
                                    .sort((a, b) => b.usageCount - a.usageCount)
                                    .slice(0, 10)
                                    .map((t) => (
                                        <div
                                            key={t.id}
                                            className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_5px_rgba(139,92,246,0.5)]" />
                                                <span className="text-[11px] font-bold text-white">
                                                    {t.name}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500">
                                                {t.usageCount}x
                                            </span>
                                        </div>
                                    ))}
                                {tools.filter((t) => t.usageCount > 0).length === 0 && (
                                    <div className="h-full flex items-center justify-center text-slate-600 text-[10px] italic">
                                        Waiting for tool signals...
                                    </div>
                                )}
                            </div>
                        </EliteCard>
                    </div>
                </div>

                {/* RIGHT: Quality & Performance */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <EliteCard glowColor="blue">
                        <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">
                            Inference Success
                        </div>
                        <div className="text-4xl text-blue-400 font-mono tracking-tighter">
                            {((1 - stats.errorRate) * 100).toFixed(1)}%
                        </div>
                        <div className="w-full bg-white/5 h-1.5 mt-4 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${(1 - stats.errorRate) * 100}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                    </EliteCard>

                    <EliteCard glowColor="purple">
                        <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">
                            Economic Impact
                        </div>
                        <div className="text-4xl text-purple-400 font-mono tracking-tighter">
                            ${totalCost.toFixed(4)}
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <div className={`px-2 py-0.5 rounded ${totalCost === 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"} text-[9px] font-bold border uppercase tracking-tighter`}>
                                {totalCost === 0 ? "Free Tier Active" : "Operational Cost"}
                            </div>
                            <span className="text-[10px] text-slate-600">
                                {stats.totalTokens.toLocaleString()} tokens used
                            </span>
                        </div>
                    </EliteCard>

                    <EliteCard glowColor="zinc" className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Globe size={14} className="text-slate-400" />
                                <span className="text-xs font-bold text-white uppercase tracking-tighter">
                                    Latency Nexus
                                </span>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <div className="space-y-4">
                            {[
                                {
                                    loc: "Primary (Gemini Cloud)",
                                    lat: Math.round(stats.avgLatency),
                                    color: stats.avgLatency < 2000 ? "text-green-400" : "text-yellow-400",
                                },
                                {
                                    loc: "Local Node (Execution)",
                                    lat: 12,
                                    color: "text-green-400",
                                },
                                {
                                    loc: "Tool Registry Nexus",
                                    lat: 45,
                                    color: "text-green-400",
                                },
                            ].map((node, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between items-center group"
                                >
                                    <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
                                        {node.loc}
                                    </span>
                                    <span
                                        className={`font-mono text-[11px] ${node.color} group-hover:scale-110 transition-transform`}
                                    >
                                        ~{Math.max(node.lat, 0)}ms
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-4 border-t border-white/5 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Model Backbone</div>
                                <TrendingUp size={10} className="text-emerald-500" />
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                                {events[0]?.model || "Gemini-Pro-1.5"} // Active
                            </div>
                        </div>
                    </EliteCard>
                </div>
            </div>
        </div>
    );
};
