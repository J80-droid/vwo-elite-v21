/**
 * AI Brain Command Center
 * A global status widget that monitors neural progress and active AI tasks
 * Part of the 750% Elite Intelligence Upgrade
 */
import { cn } from "@shared/lib/utils";
import {
    Activity,
    Brain,
    ChevronRight,
    Sparkles,
    Target,
    Zap,
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export const AIBrainCommandCenter: React.FC<{ className?: string }> = ({
    className,
}) => {
    const navigate = useNavigate();

    // Mock neural data (In a real app, these would come from global state)
    const stats = [
        {
            label: "Neural Load",
            value: 42,
            color: "text-blue-400",
            bg: "bg-blue-400/20",
        },
        {
            label: "Elite Matrix",
            value: 100,
            color: "text-emerald-400",
            bg: "bg-emerald-400/20",
        },
        {
            label: "14 Intelligences",
            value: 100,
            color: "text-purple-400",
            bg: "bg-purple-400/20",
        },
    ];

    const labs = [
        { id: "biology", name: "Biology Lab", progress: 72, icon: Activity },
        { id: "mathlab", name: "Math Lab", progress: 45, icon: Target },
        { id: "physics", name: "Physics Lab", progress: 30, icon: Zap },
    ];

    return (
        <div
            className={cn(
                "bg-obsidian-900 border border-white/10 rounded-2xl p-4 overflow-hidden relative group transition-all hover:border-blue-500/30 shadow-2xl",
                className,
            )}
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                        <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider leading-none">
                            Elite AI Brain
                        </h3>
                        <span className="text-[8px] font-mono text-blue-400/60 uppercase tracking-tighter">
                            v21.3 // 750% intelligence
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 rounded-full border border-rose-500/20">
                    <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                    <span className="text-[9px] font-black text-rose-400 uppercase">
                        God Mode
                    </span>
                </div>
            </div>

            {/* Intelligence Tiers Indicator */}
            <div className="flex gap-1 mb-4">
                <div className="flex-1 h-1 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.5)]" title="Foundation Active" />
                <div className="flex-1 h-1 bg-purple-500 rounded-full shadow-[0_0_5px_rgba(168,85,247,0.5)]" title="Elite Upgrades Active" />
                <div className="flex-1 h-1 bg-rose-500 rounded-full shadow-[0_0_5px_rgba(244,63,94,0.5)]" title="Frontier Frontier Active" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="flex flex-col">
                        <span className="text-[9px] text-white/30 uppercase font-medium truncate">
                            {stat.label}
                        </span>
                        <span className={cn("text-xs font-bold", stat.color)}>
                            {stat.value === 100 ? "Elite" : `${stat.value}%`}
                        </span>
                        <div className="w-full h-0.5 bg-white/5 mt-1 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    stat.bg.replace("/20", ""),
                                )}
                                style={{ width: `${stat.value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Lab Progress */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase mb-1">
                    <span>Module Mastery</span>
                    <Activity className="w-3 h-3" />
                </div>

                {labs.map((lab) => (
                    <div
                        key={lab.id}
                        className="flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer group/lab"
                        onClick={() => navigate(`/${lab.id}`)}
                    >
                        <div className="p-1.5 bg-black/20 rounded-lg">
                            <lab.icon className="w-3.5 h-3.5 text-white/60 group-hover/lab:text-white transition-colors" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-white/70 group-hover/lab:text-white">
                                    {lab.name}
                                </span>
                                <span className="text-[10px] font-mono text-white/30">
                                    {lab.progress}%
                                </span>
                            </div>
                            <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                                    style={{ width: `${lab.progress}%` }}
                                />
                            </div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-white/20" />
                    </div>
                ))}
            </div>

            <button
                onClick={() => navigate("/settings?module=ai")}
                className="w-full mt-4 py-2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95"
            >
                Nexus Control
            </button>
        </div>
    );
};
