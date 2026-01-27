import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import {
    Cpu,
    Monitor,
    RotateCcw
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { z } from "zod";

type CircuitComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'physics-circuit' }>;

interface CircuitEngineProps {
    component: CircuitComponent;
    mastery?: 'novice' | 'competent' | 'expert';
}

/**
 * Advanced Circuit Lab
 * Dynamic RLC simulation with real-time graph plotting and phase analysis.
 */
export const CircuitEngine: React.FC<CircuitEngineProps> = ({ component, mastery: _mastery = 'novice' }) => {
    const [frequency, setFrequency] = useState(component.config.frequency || 50);
    const [params, setParams] = useState(() => {
        const initial: Record<string, number> = {};
        component.config.components.forEach(c => {
            initial[c.id] = c.value;
        });
        return initial;
    });

    const circuitData = useMemo(() => {
        const data = [];
        const R = params['r1'] || 100;
        const L = (params['l1'] || 0.1);
        const C = (params['c1'] || 0.0001);
        const w = 2 * Math.PI * frequency;

        const Xl = w * L;
        const Xc = 1 / (w * C || 1e-9);
        const Z = Math.sqrt(R ** 2 + (Xl - Xc) ** 2);
        const phase = Math.atan((Xl - Xc) / R);

        for (let t = 0; t < 0.1; t += 0.001) {
            const voltage = 230 * Math.sin(w * t);
            const current = (230 / Z) * Math.sin(w * t - phase);
            data.push({
                time: t.toFixed(3),
                voltage: voltage,
                current: current * 50, // Scaled for visibility
            });
        }
        return data;
    }, [frequency, params]);

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-950/40 border border-white/5 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <Cpu size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                            Circuit Lab v2.1
                            <span className="text-[10px] not-italic font-mono bg-white/5 px-2 py-0.5 rounded text-white/40 tracking-normal uppercase">RLC Advanced</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Impedance & Resonance • VWO Exam G1</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setFrequency(50);
                        setParams(Object.fromEntries(component.config.components.map(c => [c.id, c.value])));
                    }}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                >
                    <RotateCcw size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="w-full aspect-video bg-obsidian-900 rounded-[2rem] border border-white/10 shadow-inner p-6 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
                        <svg width="400" height="200" viewBox="0 0 400 200" className="relative z-10">
                            {/* Simple RLC Schematic */}
                            <path d="M 50 100 L 100 100" stroke="#6366f1" strokeWidth="3" fill="none" />
                            {/* Resistor */}
                            <path d="M 100 100 L 110 80 L 130 120 L 150 80 L 170 120 L 190 100" stroke="#6366f1" strokeWidth="3" fill="none" />
                            <path d="M 190 100 L 220 100" stroke="#6366f1" strokeWidth="3" fill="none" />
                            {/* Inductor */}
                            <path d="M 220 100 Q 230 70 240 100 Q 250 70 260 100 Q 270 70 280 100 Q 290 70 300 100" stroke="#f59e0b" strokeWidth="3" fill="none" />
                            <path d="M 300 100 L 350 100" stroke="#f59e0b" strokeWidth="3" fill="none" />

                            <text x="130" y="60" fill="white" fontSize="12" fontWeight="bold">R</text>
                            <text x="250" y="60" fill="white" fontSize="12" fontWeight="bold">L</text>
                            <circle cx="50" cy="100" r="15" fill="none" stroke="#ec4899" strokeWidth="3" />
                            <path d="M 40 100 Q 50 90 60 100 Q 50 110 40 100" stroke="#ec4899" strokeWidth="2" fill="none" />
                        </svg>

                        <div className="absolute bottom-6 right-6 flex gap-4 text-[9px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-pink-500" /> Voltage (U)</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Current (I)</div>
                        </div>
                    </div>

                    <div className="h-48 bg-black/40 rounded-2xl border border-white/5 p-4 overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={circuitData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="time" hide />
                                <YAxis hide domain={[-300, 300]} />
                                <Tooltip
                                    contentStyle={{ background: '#0a0a0c', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Line type="monotone" dataKey="voltage" stroke="#ec4899" strokeWidth={2} dot={false} isAnimationActive={false} />
                                <Line type="monotone" dataKey="current" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-[2rem] backdrop-blur-xl">
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 block mb-3">Live Parameters</span>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase">
                                    <span>Frequentie (f)</span>
                                    <span className="text-amber-400 font-mono">{frequency} Hz</span>
                                </div>
                                <input
                                    type="range" min="10" max="200" step="1"
                                    value={frequency}
                                    onChange={(e) => setFrequency(parseInt(e.target.value))}
                                    className="w-full accent-amber-500"
                                />
                            </div>
                            {component.config.components.map(comp => (
                                <div key={comp.id} className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase">
                                        <span>{comp.type.charAt(0).toUpperCase() + comp.type.slice(1)} ({comp.id})</span>
                                        <span className="text-white font-mono">{params[comp.id] ?? 0} {comp.type === 'resistor' ? 'Ω' : comp.type === 'inductor' ? 'H' : 'F'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={comp.type === 'resistor' ? 10 : 0.001}
                                        max={comp.type === 'resistor' ? 1000 : 1}
                                        step={comp.type === 'resistor' ? 10 : 0.001}
                                        value={params[comp.id] ?? 0}
                                        onChange={(e) => setParams({ ...params, [comp.id]: parseFloat(e.target.value) })}
                                        className="w-full accent-indigo-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl border border-white/5 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] text-amber-500 font-black uppercase tracking-widest">
                            <Monitor className="w-3 h-3" />
                            <span>Impedantie Analyse</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                <span className="text-[8px] text-slate-500 block uppercase font-bold">Faseverschil</span>
                                <span className="text-xs text-white font-mono">
                                    {(Math.atan((2 * Math.PI * frequency * (params['l1'] || 0.1) - 1 / (2 * Math.PI * frequency * (params['c1'] || 0.0001))) / (params['r1'] || 100)) * 180 / Math.PI).toFixed(1)}°
                                </span>
                            </div>
                            <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                <span className="text-[8px] text-slate-500 block uppercase font-bold">Resonantiefreq.</span>
                                <span className="text-xs text-white font-mono">
                                    {(1 / (2 * Math.PI * Math.sqrt((params['l1'] || 0.1) * (params['c1'] || 0.0001)))).toFixed(1)} Hz
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
