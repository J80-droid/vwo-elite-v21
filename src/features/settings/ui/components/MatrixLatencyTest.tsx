import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { testLatency } from '@shared/api/globalHealthService';

interface LatencyResult {
    provider: string;
    latency: number;
    status: 'success' | 'error' | 'pending';
}

export const MatrixLatencyTest: React.FC<{ providers: { id: string, name: string, key: string }[] }> = ({ providers }) => {
    const [results, setResults] = useState<Record<string, LatencyResult>>({});
    const [isTesting, setIsTesting] = useState(false);

    const runTest = async () => {
        setIsTesting(true);
        const activeProviders = providers.filter(p => !!p.key && p.key !== 'none');

        // Parallel testing
        const tests = activeProviders.map(async (p) => {
            setResults(prev => ({ ...prev, [p.id]: { provider: p.name, latency: 0, status: 'pending' } }));
            const latency = await testLatency(p.id, p.key);
            setResults(prev => ({
                ...prev,
                [p.id]: {
                    provider: p.name,
                    latency,
                    status: latency > 0 ? 'success' : 'error'
                }
            }));
        });

        await Promise.all(tests);
        setIsTesting(false);
    };

    return (
        <div className="bg-obsidian-950 border border-white/10 rounded-2xl p-6 mb-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Zap size={16} className="text-electric" />
                        Matrix Latency Test
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Meet de real-time reactiesnelheid van je geconfigureerde engines.</p>
                </div>
                <button
                    onClick={runTest}
                    disabled={isTesting}
                    className="px-4 py-2 bg-electric text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-400 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50"
                >
                    {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {isTesting ? "Testen..." : "Test Alle Verbindingen"}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {providers.filter(p => !!p.key && p.key !== 'none').map((p) => {
                    const res = results[p.id];
                    return (
                        <div key={p.id} className="bg-obsidian-900 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-2 text-center min-h-[80px]">
                            <span className="text-[9px] font-bold text-white/50 uppercase truncate w-full">{p.name}</span>
                            {res ? (
                                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                                    {res.status === 'pending' ? (
                                        <Loader2 size={16} className="text-electric animate-spin" />
                                    ) : res.status === 'success' ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-black text-emerald-400 italic tracking-tighter">{res.latency}ms</span>
                                            <CheckCircle size={10} className="text-emerald-500/50" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-rose-500 uppercase">Offline</span>
                                            <XCircle size={10} className="text-rose-500/50" />
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="text-[10px] font-bold text-slate-700 tracking-widest uppercase">Klaar</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
