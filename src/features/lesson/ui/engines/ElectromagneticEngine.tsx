import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import {
    Magnet,
    RotateCcw,
    Zap
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";

type FieldComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'physics-field' }>;

interface ElectromagneticEngineProps {
    component: FieldComponent;
    mastery?: 'novice' | 'competent' | 'expert';
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    history: { x: number; y: number }[];
    color: string;
}

/**
 * Electromagnetic Field Engine
 * Canvas-based visualization for field lines and Lorentz force deflection.
 */
export const ElectromagneticEngine: React.FC<ElectromagneticEngineProps> = ({ component, mastery = 'novice' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [params, setParams] = useState({
        strength: component.config.strength || 1,
        particleCharge: component.config.particleCharge || 1,
        particleMass: component.config.particleMass || 1,
        velocity: component.config.velocity || 5,
    });

    const [particles, setParticles] = useState<Particle[]>([]);

    // Physics Simulation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // 1. Draw Background Field Lines
            if (component.config.type === 'magnetic') {
                drawMagneticField(ctx, width, height, params.strength);
            } else if (component.config.type === 'electric') {
                drawElectricField(ctx, width, height, params.strength);
            }

            // 2. Update and Draw Particles (Lorentz Force)
            if (component.config.type === 'lorentz' || particles.length > 0) {
                updateParticles(ctx, width, height);
            }

            requestAnimationFrame(render);
        };

        const drawMagneticField = (ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) => {
            ctx.strokeStyle = `rgba(99, 102, 241, ${Math.abs(strength) * 0.2})`;
            ctx.lineWidth = 1;
            const spacing = 40;
            for (let x = spacing; x < w; x += spacing) {
                for (let y = spacing; y < h; y += spacing) {
                    ctx.beginPath();
                    if (strength > 0) {
                        // In het canvas (X)
                        ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
                        ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5);
                    } else {
                        // Uit het canvas (.)
                        ctx.arc(x, y, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.stroke();
                }
            }
        };

        const drawElectricField = (ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) => {
            ctx.strokeStyle = `rgba(236, 72, 153, ${Math.abs(strength) * 0.2})`;
            ctx.lineWidth = 1;
            const spacing = 40;
            for (let y = spacing; y < h; y += spacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
                // Arrows
                for (let x = spacing; x < w; x += spacing * 2) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x - 5, y - 3);
                    ctx.moveTo(x, y);
                    ctx.lineTo(x - 5, y + 3);
                    ctx.stroke();
                }
            }
        };

        const updateParticles = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            setParticles(prev => prev.map(p => {
                // Lorentz Force: F = q(E + v x B)
                // Simplified for 2D
                let ay = 0;
                const ax = 0;

                if (component.config.type === 'electric') {
                    ay = (params.particleCharge * params.strength) / Math.max(0.1, params.particleMass);
                } else if (component.config.type === 'magnetic' || component.config.type === 'lorentz') {
                    // Magnetic force is perpendicular to v
                    const force = params.particleCharge * p.vx * params.strength;
                    ay = force / Math.max(0.1, params.particleMass);
                }

                p.vx += ax * 0.1;
                p.vy += ay * 0.1;
                p.x += p.vx;
                p.y += p.vy;

                // Draw Trace
                p.history.push({ x: p.x, y: p.y });
                if (p.history.length > 100) p.history.shift();

                ctx.beginPath();
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                p.history.forEach((pos: { x: number; y: number }, i: number) => {
                    if (i === 0) ctx.moveTo(pos.x, pos.y);
                    else ctx.lineTo(pos.x, pos.y);
                });
                ctx.stroke();

                // Draw Particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();

                return p;
            }).filter(p => p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h));
        };

        const frame = requestAnimationFrame(render);
        return () => cancelAnimationFrame(frame);
    }, [params, component.config.type, particles.length]);

    const spawnParticle = () => {
        const newParticle = {
            x: 0,
            y: 200,
            vx: params.velocity,
            vy: 0,
            history: [],
            color: params.particleCharge >= 0 ? '#10B981' : '#EF4444',
        };
        setParticles(prev => [...prev, newParticle]);
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-950/40 border border-white/5 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-electric/10 rounded-2xl border border-electric/20 text-electric shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Magnet size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                            Field Core v1.0
                            <span className="text-[10px] not-italic font-mono bg-white/5 px-2 py-0.5 rounded text-white/40 tracking-normal uppercase">{component.config.type}</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Electromagnetic Fields • VWO Exam D2/E2</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setParticles([])}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button
                        onClick={spawnParticle}
                        className="px-6 py-2 bg-electric/20 hover:bg-electric/30 border border-electric/30 rounded-2xl text-electric text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Shoot Particle
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                <div className="lg:col-span-8 relative">
                    <div className="w-full aspect-video bg-obsidian-900 rounded-[2rem] border border-white/10 shadow-inner overflow-hidden relative cursor-crosshair">
                        <canvas
                            ref={canvasRef}
                            width={700}
                            height={400}
                            className="w-full h-full"
                        />
                        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20 pointer-events-none bg-black/40 p-3 rounded-xl backdrop-blur-md border border-white/5">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${params.strength > 0 ? 'bg-indigo-500' : 'bg-pink-500'}`} />
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">
                                    {component.config.type === 'magnetic' ? 'B-Field' : 'E-Field'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="space-y-4">
                        <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-[2rem] backdrop-blur-xl">
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block mb-3">Field Parameters</span>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase">
                                        <span>Field Strength</span>
                                        <span className="text-electric font-mono">{params.strength.toFixed(2)} T/V</span>
                                    </div>
                                    <input
                                        type="range" min="-5" max="5" step="0.1"
                                        value={params.strength}
                                        onChange={(e) => setParams({ ...params, strength: parseFloat(e.target.value) })}
                                        className="w-full accent-electric"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase">
                                        <span>Particle Charge</span>
                                        <span className="text-emerald-400 font-mono">{params.particleCharge} e</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setParams({ ...params, particleCharge: -1 })}
                                            className={`flex-1 p-2 rounded-xl border text-[10px] font-black ${params.particleCharge === -1 ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                                        >
                                            NEGATIVE
                                        </button>
                                        <button
                                            onClick={() => setParams({ ...params, particleCharge: 1 })}
                                            className={`flex-1 p-2 rounded-xl border text-[10px] font-black ${params.particleCharge === 1 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                                        >
                                            POSITIVE
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase">
                                        <span>Velocity (v)</span>
                                        <span className="text-amber-400 font-mono">{params.velocity} m/s</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="20" step="1"
                                        value={params.velocity}
                                        onChange={(e) => setParams({ ...params, velocity: parseInt(e.target.value) })}
                                        className="w-full accent-amber-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3 items-start">
                            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                                {mastery === 'expert' ?
                                    "Lorentzkracht: F_L = q * v * B. De richting wordt bepaald door de linker- of rechterhandregel." :
                                    "Observeer hoe de lading van het deeltje de afbuiging beïnvloedt."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
