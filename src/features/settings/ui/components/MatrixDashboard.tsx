import {
    getGlobalStatus,
    type ProviderHealthStatus,
} from "@shared/api/globalHealthService";
import {
    Activity,
    AlertCircle,
    Clock,
    RefreshCw,
    TrendingUp,
    Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

export const GlobalHealthDashboard: React.FC = () => {
    const [statuses, setStatuses] = useState<ProviderHealthStatus[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const data = await getGlobalStatus();
            setStatuses(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 300000); // 5 mins
        return () => clearInterval(interval);
    }, []);

    if (loading && statuses.length === 0) return null;

    return (
        <div className="space-y-4 mb-8 h-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="text-emerald-500" size={16} />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Health Audit</h3>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchStatus(); }}
                    className="p-1 px-2 text-[10px] font-bold text-electric hover:bg-electric/10 rounded transition-all flex items-center gap-1.5"
                >
                    <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                    VERVERSEN
                </button>
            </div>

            <div className="flex flex-wrap gap-3">
                {statuses.map((s: ProviderHealthStatus) => (
                    <div
                        key={s.provider}
                        className="bg-obsidian-900/40 border border-white/5 rounded-xl px-3 py-1.5 flex items-center gap-2.5 hover:border-white/10 hover:bg-white/5 transition-all cursor-help group"
                        title={s.message || `${s.provider} status: ${s.status}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'operational' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                            s.status === 'degraded' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' :
                                s.status === 'outage' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-slate-500'
                            }`} />
                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-tighter group-hover:text-white/80 transition-colors">{s.provider}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${s.status === 'operational' ? 'text-emerald-400' :
                            s.status === 'degraded' ? 'text-amber-400' :
                                s.status === 'outage' ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                            {s.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const UsageTracker: React.FC<{ stats: { totalTokens: number, totalRequests: number, avgLatency: number, errorRate: number } }> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-obsidian-950 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-400">
                    <TrendingUp size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Totaal Tokens</span>
                </div>
                <div className="text-2xl font-black text-white italic tracking-tighter">
                    {stats.totalTokens.toLocaleString()}
                </div>
            </div>
            <div className="bg-obsidian-950 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-purple-400">
                    <Zap size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Requests</span>
                </div>
                <div className="text-2xl font-black text-white italic tracking-tighter">
                    {stats.totalRequests}
                </div>
            </div>
            <div className="bg-obsidian-950 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                    <Clock size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Gem. Latency</span>
                </div>
                <div className="text-2xl font-black text-white italic tracking-tighter">
                    {Math.round(stats.avgLatency)}<span className="text-xs ml-1">ms</span>
                </div>
            </div>
            <div className="bg-obsidian-950 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-400">
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Error Rate</span>
                </div>
                <div className="text-2xl font-black text-white italic tracking-tighter">
                    {(stats.errorRate * 100).toFixed(1)}%
                </div>
            </div>
        </div>
    );
};
