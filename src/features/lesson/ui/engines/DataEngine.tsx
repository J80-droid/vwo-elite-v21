import { useDataExport } from "@shared/hooks/useDataExport";
import { useEngineState } from "@shared/hooks/useEngineState";
import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import {
    Database,
    Download,
    RotateCcw,
    Table as TableIcon,
    TrendingUp
} from "lucide-react";
import React, { useMemo } from "react";
import {
    CartesianGrid,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { z } from "zod";

type DataComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'data-analysis' }>;

interface DataEngineProps {
    component: DataComponent;
    mastery?: 'novice' | 'competent' | 'expert';
}

/**
 * Data Explorer Engine
 * Statistical analysis and visualization for research datasets.
 */
export const DataEngine: React.FC<DataEngineProps> = ({ component, mastery: _mastery = 'novice' }) => {
    const { exportToCSV, exportToPNG } = useDataExport();
    // Persist dataset changes locally if user edits them (future feature)
    // For now, we persist the view state
    const [showRegression, setShowRegression] = useEngineState(`data-engine-${component.config.type}-showReg`, true);

    const data = component.config.data;

    const stats = useMemo(() => {
        const n = data.length;
        if (n < 2) return null; // Need at least 2 points for regression

        const sumX = data.reduce((acc, p) => acc + p.x, 0);
        const sumY = data.reduce((acc, p) => acc + p.y, 0);
        const sumXY = data.reduce((acc, p) => acc + p.x * p.y, 0);
        const sumX2 = data.reduce((acc, p) => acc + p.x * p.x, 0);

        const denominator = n * sumX2 - sumX * sumX;
        if (denominator === 0) return null; // Vertical line protection

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        // R^2 calculation
        const meanY = sumY / n;
        const tss = data.reduce((acc, p) => acc + (p.y - meanY) ** 2, 0);
        const rss = data.reduce((acc, p) => acc + (p.y - (slope * p.x + intercept)) ** 2, 0);
        const r2 = 1 - rss / tss;

        return { slope, intercept, r2 };
    }, [data]);

    const regressionData = useMemo(() => {
        if (!stats) return [];
        const minX = Math.min(...data.map(p => p.x));
        const maxX = Math.max(...data.map(p => p.x));

        return [
            { x: minX, y: stats.slope * minX + stats.intercept },
            { x: maxX, y: stats.slope * maxX + stats.intercept }
        ];
    }, [data, stats]);

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-950/40 border border-white/5 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Database size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                            Data Lab v1.0
                            <span className="text-[10px] not-italic font-mono bg-white/5 px-2 py-0.5 rounded text-white/40 tracking-normal uppercase">{component.config.type}</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Statistical Analysis • PWS Research</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => exportToCSV(data, 'research-data')}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        title="Export Data (CSV)"
                    >
                        <Download size={18} />
                    </button>
                    <button
                        onClick={() => exportToPNG('data-chart', 'research-chart')}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        title="Export Chart (PNG)"
                    >
                        <TrendingUp size={18} />
                    </button>
                    <button
                        onClick={() => setShowRegression(prev => !prev)}
                        className={`p-3 border border-white/10 rounded-2xl transition-all active:scale-90 ${showRegression ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400'}`}
                        title="Toggle Regression Line"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                <div className="lg:col-span-8">
                    <div className="w-full aspect-video bg-obsidian-900 rounded-[2rem] border border-white/10 shadow-inner p-4 overflow-hidden relative">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    name="X"
                                    stroke="#666"
                                    label={{ value: component.config.xAxisLabel || 'X', position: 'bottom', fill: '#666', fontSize: 10 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name="Y"
                                    stroke="#666"
                                    label={{ value: component.config.yAxisLabel || 'Y', angle: -90, position: 'left', fill: '#666', fontSize: 10 }}
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ background: '#0a0a0c', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                                />
                                <Scatter name="Dataset" data={data} fill="#6366f1" />
                                {stats && (
                                    <Scatter
                                        name="Regression"
                                        data={regressionData}
                                        line={{ stroke: '#ec4899', strokeWidth: 2 }}
                                        shape={() => <></>}
                                        legendType="line"
                                        opacity={showRegression ? 1 : 0}
                                    />
                                )}
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-[2rem] backdrop-blur-xl">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block mb-3">Regression Results</span>
                        {stats ? (
                            <div className="space-y-4">
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Trendlijn Vergelijking</span>
                                    <span className="text-sm text-white font-serif italic">
                                        y = {stats.slope.toFixed(3)}x + {stats.intercept.toFixed(3)}
                                    </span>
                                </div>
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-[8px] text-slate-500 block uppercase font-bold">R-Kwadraat (R²)</span>
                                    <div className="flex items-end gap-2">
                                        <span className="text-xl text-emerald-400 font-mono font-black">{stats.r2.toFixed(4)}</span>
                                        <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-white/40 italic">Geen data beschikbaar voor analyse.</p>
                        )}
                    </div>

                    <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-4 space-y-2 overflow-y-auto">
                        <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2">
                            <TableIcon className="w-3 h-3" />
                            <span>Ruwe Data</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="font-bold text-slate-500 uppercase px-2">X</div>
                            <div className="font-bold text-slate-500 uppercase px-2">Y</div>
                            {data.slice(0, 10).map((p, i) => (
                                <React.Fragment key={i}>
                                    <div className="bg-black/20 p-1 rounded font-mono text-white/80 px-2">{p.x}</div>
                                    <div className="bg-black/20 p-1 rounded font-mono text-white/80 px-2">{p.y}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
