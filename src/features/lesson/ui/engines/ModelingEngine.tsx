import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import {
    Activity,
    Calculator,
    FunctionSquare,
    RotateCcw,
    Variable
} from "lucide-react";
import React, { useMemo, useState } from "react";
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

type ModelingComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'model-fitting' }>;

interface ModelingEngineProps {
    component: ModelingComponent;
    mastery?: 'novice' | 'competent' | 'expert';
}

/**
 * Model Fitting Engine
 * Interactive curve fitting for mathematical modeling (PWS Research).
 */
export const ModelingEngine: React.FC<ModelingEngineProps> = ({ component, mastery: _mastery = 'novice' }) => {
    const [params, setParams] = useState<Record<string, number>>(component.config.initialParams || { a: 1, b: 1, c: 0 });
    const data = component.config.data;

    // Calculate model points based on type and current params
    const modelData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const minX = Math.min(...data.map(p => p.x));
        const maxX = Math.max(...data.map(p => p.x));
        // Add 20% padding to X range
        const range = maxX - minX;
        const start = minX - range * 0.1;
        const end = maxX + range * 0.1;

        const points = [];
        const step = (end - start) / 50;

        for (let x = start; x <= end; x += step) {
            let y = 0;
            const { a = 1, b = 1, c = 0 } = params;

            switch (component.config.modelType) {
                case 'linear':
                    // y = ax + b
                    y = a * x + b;
                    break;
                case 'exponential':
                    // y = a * e^(bx) + c
                    y = a * Math.exp(b * x) + c;
                    break;
                case 'power':
                    // y = a * x^b + c
                    y = a * Math.pow(x, b) + c;
                    break;
            }
            points.push({ x, y });
        }
        return points;
    }, [params, component.config.modelType, data]);

    // Calculate Residual Sum of Squares (RSS)
    const errorMetrics = useMemo(() => {
        const { a = 1, b = 1, c = 0 } = params;
        let rss = 0;

        data.forEach(p => {
            let pred = 0;
            switch (component.config.modelType) {
                case 'linear': pred = a * p.x + b; break;
                case 'exponential': pred = a * Math.exp(b * p.x) + c; break;
                case 'power': pred = a * Math.pow(p.x, b) + c; break;
            }
            rss += (p.y - pred) ** 2;
        });

        return { rss, mse: rss / data.length };
    }, [params, data, component.config.modelType]);

    const handleParamChange = (key: string, value: number) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-950/40 border border-white/5 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.2)]">
                        <FunctionSquare size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                            Model Lab v2.0
                            <span className="text-[10px] not-italic font-mono bg-white/5 px-2 py-0.5 rounded text-white/40 tracking-normal uppercase">{component.config.modelType}</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Mathematical Modeling • Research</p>
                    </div>
                </div>
                <button
                    onClick={() => setParams(component.config.initialParams || { a: 1, b: 1, c: 0 })}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                >
                    <RotateCcw size={18} />
                </button>
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
                                    domain={['auto', 'auto']}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name="Y"
                                    stroke="#666"
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ background: '#0a0a0c', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                                />
                                <Scatter name="Data" data={data} fill="#2dd4bf" shape="circle" />
                                <Scatter name="Model" data={modelData} line={{ stroke: '#f43f5e', strokeWidth: 2 }} shape={() => <></>} legendType="line" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="p-5 bg-gradient-to-br from-teal-500/10 to-emerald-600/10 border border-teal-500/20 rounded-[2rem] backdrop-blur-xl">
                        <span className="text-[9px] font-black uppercase tracking-widest text-teal-400 block mb-3">Model Parameters</span>
                        <div className="space-y-4">
                            {Object.keys(params).map(key => (
                                <div key={key} className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase">
                                        <span>Parameter {key}</span>
                                        <span className="text-teal-400 font-mono">{(params[key] ?? 0).toFixed(2)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-10"
                                        max="10"
                                        step="0.1"
                                        value={params[key]}
                                        onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                                        className="w-full accent-teal-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl border border-white/5 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] text-teal-400 font-black uppercase tracking-widest">
                            <Calculator className="w-3 h-3" />
                            <span>Fit Kwaliteit</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                <span className="text-[8px] text-slate-500 block uppercase font-bold">Residuele Fout (RSS)</span>
                                <span className={`text-sm font-mono font-bold ${errorMetrics.rss < 10 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {errorMetrics.rss.toFixed(4)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3 items-start">
                        <div className="mt-0.5">
                            {component.config.modelType === 'linear' && <Variable className="w-4 h-4 text-teal-400" />}
                            {component.config.modelType === 'exponential' && <Activity className="w-4 h-4 text-teal-400" />}
                            {component.config.modelType === 'power' && <FunctionSquare className="w-4 h-4 text-teal-400" />}
                        </div>
                        <div className="text-[10px] text-white/40 font-medium leading-relaxed font-serif italic">
                            {component.config.modelType === 'linear' && `f(x) = ${params.a?.toFixed(2)}x + ${params.b?.toFixed(2)}`}
                            {component.config.modelType === 'exponential' && `f(x) = ${params.a?.toFixed(2)} • e^(${params.b?.toFixed(2)}x) + ${params.c?.toFixed(2)}`}
                            {component.config.modelType === 'power' && `f(x) = ${params.a?.toFixed(2)} • x^(${params.b?.toFixed(2)}) + ${params.c?.toFixed(2)}`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
