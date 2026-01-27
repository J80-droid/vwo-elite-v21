import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import {
    Atom,
    Microwave,
    RotateCcw,
    Zap
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { z } from "zod";

type QuantumComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'physics-quantum' }>;

interface QuantumEngineProps {
    component: QuantumComponent;
    mastery?: 'novice' | 'competent' | 'expert';
}

interface Electron {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

/**
 * Quantum Excellence Engine
 * Simulations for the photoelectric effect and Bohr atomic model.
 */
export const QuantumEngine: React.FC<QuantumEngineProps> = ({ component, mastery: _mastery = 'novice' }) => {
    const [frequency, setFrequency] = useState(component.config.frequency || 6e14);
    const [intensity, setIntensity] = useState(component.config.intensity || 50);
    const [electrons, setElectrons] = useState<Electron[]>([]);

    // Constants
    const h = 6.626e-34;
    const workFunction = (component.config.workFunction || 2.3) * 1.602e-19; // eV to Joules

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;
        if (component.config.experiment === 'photoelectric') {
            const photonEnergy = h * frequency;
            if (photonEnergy > workFunction) {
                intervalId = setInterval(() => {
                    if (Math.random() < intensity / 100) {
                        const v0 = Math.sqrt((2 * (photonEnergy - workFunction)) / 9.109e-31);
                        setElectrons(prev => [...prev.slice(-20), {
                            id: Math.random(),
                            x: 100,
                            y: 100 + Math.random() * 100,
                            vx: v0 * 1e-6, // Scale for display
                            vy: (Math.random() - 0.5) * 2
                        }]);
                    }
                }, 50);
            }
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [frequency, intensity, component.config.experiment, h, workFunction]);

    // Animation loop for electrons
    useEffect(() => {
        if (electrons.length === 0) return;
        const interval = setInterval(() => {
            setElectrons(prev => prev.map(e => ({
                ...e,
                x: e.x + e.vx,
                y: e.y + e.vy
            })).filter(e => e.x < 500));
        }, 16);
        return () => clearInterval(interval);
    }, [electrons.length]);

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-950/40 border border-white/5 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/20 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
                        <Atom size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                            Quantum Lab v4.x
                            <span className="text-[10px] not-italic font-mono bg-white/5 px-2 py-0.5 rounded text-white/40 tracking-normal uppercase">{component.config.experiment}</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Quantum Physics • Syllabus F1</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setFrequency(6e14);
                        setIntensity(50);
                        setElectrons([]);
                    }}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                >
                    <RotateCcw size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                <div className="lg:col-span-8 relative">
                    <div className="w-full aspect-video bg-obsidian-900 rounded-[2rem] border border-white/10 shadow-inner p-6 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

                        {component.config.experiment === 'photoelectric' ? (
                            <div className="relative w-full h-full">
                                {/* Cathode */}
                                <div className="absolute left-20 top-1/4 bottom-1/4 w-4 bg-slate-700 border-2 border-slate-500 rounded-lg shadow-lg" />
                                {/* Anode */}
                                <div className="absolute right-20 top-1/4 bottom-1/4 w-4 bg-slate-700 border-2 border-slate-500 rounded-lg shadow-lg opacity-40" />

                                {/* Light Rays */}
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-40 h-2 bg-gradient-to-r from-transparent animate-pulse"
                                    style={{
                                        backgroundColor: frequency > 7.5e14 ? '#a855f7' : frequency > 6e14 ? '#3b82f6' : frequency > 5e14 ? '#22c55e' : '#ef4444',
                                        boxShadow: `0 0 20px ${frequency > 7.5e14 ? '#a855f7' : frequency > 6e14 ? '#3b82f6' : frequency > 5e14 ? '#22c55e' : '#ef4444'}`
                                    }}
                                />

                                {/* Electrons */}
                                {electrons.map(e => (
                                    <div
                                        key={e.id}
                                        className="absolute w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_#F59E0B]"
                                        style={{ left: e.x, top: e.y }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="relative w-64 h-64 border-2 border-white/10 rounded-full flex items-center justify-center">
                                {/* Nucleus */}
                                <div className="w-8 h-8 bg-pink-500 rounded-full shadow-[0_0_20px_#EC4899] z-10" />
                                {/* Bohr Shells */}
                                <div className="absolute w-32 h-32 border border-white/20 rounded-full" />
                                <div className="absolute w-48 h-48 border border-white/20 rounded-full" />
                                <div className="absolute w-64 h-64 border border-white/20 rounded-full" />

                                <div className="absolute bottom-4 left-4 text-[10px] text-white/40 font-mono">n=1, n=2, n=3</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="p-5 bg-gradient-to-br from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-[2rem] backdrop-blur-xl">
                        <span className="text-[9px] font-black uppercase tracking-widest text-pink-400 block mb-3">Quantum Parameters</span>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase">
                                    <span>Lichtfrequentie (f)</span>
                                    <span className="text-pink-400 font-mono">{(frequency / 1e14).toFixed(1)} × 10¹⁴ Hz</span>
                                </div>
                                <input
                                    type="range" min="3e14" max="9e14" step="0.1e14"
                                    value={frequency}
                                    onChange={(e) => setFrequency(parseFloat(e.target.value))}
                                    className="w-full accent-pink-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase">
                                    <span>Intensiteit (I)</span>
                                    <span className="text-white font-mono">{intensity}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100" step="1"
                                    value={intensity}
                                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                                    className="w-full accent-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl border border-white/5 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] text-pink-400 font-black uppercase tracking-widest">
                            <Microwave className="w-3 h-3" />
                            <span>Energie Analyse</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                <span className="text-[8px] text-slate-500 block uppercase font-bold">Photon Energie (E_f)</span>
                                <span className="text-xs text-white font-mono">
                                    {(h * frequency / 1.602e-19).toFixed(2)} eV
                                </span>
                            </div>
                            <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                <span className="text-[8px] text-slate-500 block uppercase font-bold">Max. Kimetische Energie (E_k,max)</span>
                                <span className={`text-xs font-mono ${(h * frequency > workFunction) ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {Math.max(0, (h * frequency - workFunction) / 1.602e-19).toFixed(2)} eV
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3 items-start">
                        <Zap className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                            {h * frequency > workFunction ?
                                "De energie van de fotonen is groter dan de uittree-energie. Elektronen worden vrijgemaakt." :
                                "Frequetie te laag! Zelfs met maximale intensiteit worden er geen elektronen vrijgemaakt."
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
