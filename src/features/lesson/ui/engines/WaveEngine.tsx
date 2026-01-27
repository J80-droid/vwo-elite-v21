import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import {
    Activity,
    RotateCcw,
    Waves
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";

type WaveComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'physics-wave' }>;

interface WaveEngineProps {
    component: WaveComponent;
    mastery?: 'novice' | 'competent' | 'expert';
}

/**
 * Wave Discovery Engine
 * High-performance canvas rendering for wave interference and mechanical waves.
 */
export const WaveEngine: React.FC<WaveEngineProps> = ({ component, mastery = 'novice' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [wavelength, setWavelength] = useState(component.config.wavelength || 50);
    const [slitWidth, setSlitWidth] = useState(component.config.slitWidth || 20);
    const [phase, setPhase] = useState(0);

    // Simulation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            setPhase(p => (p + 0.1) % (Math.PI * 2));
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            if (component.config.mode === 'interference') {
                drawInterference(ctx, w, h);
            } else if (component.config.mode === 'standing-wave') {
                drawStandingWave(ctx, w, h);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        const drawInterference = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            const imageData = ctx.createImageData(w, h);
            const data = imageData.data;

            // Double Slit positions
            const s1y = h / 2 - slitWidth;
            const s2y = h / 2 + slitWidth;
            const s1x = 50;
            const s2x = 50;

            const k = (2 * Math.PI) / wavelength;

            for (let x = 0; x < w; x++) {
                for (let y = 0; y < h; y++) {
                    const d1 = Math.sqrt((x - s1x) ** 2 + (y - s1y) ** 2);
                    const d2 = Math.sqrt((x - s2x) ** 2 + (y - s2y) ** 2);

                    const amp1 = Math.sin(k * d1 - phase);
                    const amp2 = Math.sin(k * d2 - phase);
                    const totalAmp = (amp1 + amp2) / 2;

                    const index = (y * w + x) * 4;
                    const brightness = Math.floor((totalAmp + 1) * 127);

                    data[index] = 99;     // R
                    data[index + 1] = 102; // G
                    data[index + 2] = 241; // B
                    data[index + 3] = brightness; // Alpha based on wave amplitude
                }
            }
            ctx.putImageData(imageData, 0, 0);

            // Draw Slits UI
            ctx.fillStyle = '#1e1e2e';
            ctx.fillRect(45, 0, 10, s1y - 5);
            ctx.fillRect(45, s1y + 5, 10, s2y - s1y - 10);
            ctx.fillRect(45, s2y + 5, 10, h - s2y);
        };

        const drawStandingWave = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.beginPath();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);

            for (let x = 0; x < w; x += 2) {
                const y = h / 2 + Math.sin((Math.PI * x) / w * 3) * 50 * Math.sin(phase);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Nodes & Antinodes
            if (mastery !== 'novice') {
                ctx.fillStyle = '#ec4899';
                [0, w / 3, 2 * w / 3, w].forEach(nx => {
                    ctx.beginPath();
                    ctx.arc(nx, h / 2, 4, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        };

        animationFrameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameId);
    }, [wavelength, slitWidth, phase, component.config.mode, mastery]);

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-950/40 border border-white/5 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Waves size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                            Wave Core v3.0
                            <span className="text-[10px] not-italic font-mono bg-white/5 px-2 py-0.5 rounded text-white/40 tracking-normal uppercase">{component.config.mode}</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Wave Dynamics • syllabus B2</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                <div className="lg:col-span-8 relative">
                    <div className="w-full aspect-video bg-obsidian-900 rounded-[2rem] border border-white/10 shadow-inner overflow-hidden relative">
                        <canvas
                            ref={canvasRef}
                            width={700}
                            height={400}
                            className="w-full h-full"
                        />
                        <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20 pointer-events-none bg-black/40 p-3 rounded-xl backdrop-blur-md border border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Wavefield Rendering</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-[2rem] backdrop-blur-xl">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block mb-3">Interference Params</span>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase">
                                    <span>Golflengte (\lambda)</span>
                                    <span className="text-electric font-mono">{wavelength} nm</span>
                                </div>
                                <input
                                    type="range" min="20" max="100" step="1"
                                    value={wavelength}
                                    onChange={(e) => setWavelength(parseInt(e.target.value))}
                                    className="w-full accent-electric"
                                />
                            </div>
                            {component.config.mode === 'interference' && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase">
                                        <span>Spleetafstand (d)</span>
                                        <span className="text-white font-mono">{slitWidth} \mu m</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="100" step="1"
                                        value={slitWidth}
                                        onChange={(e) => setSlitWidth(parseInt(e.target.value))}
                                        className="w-full accent-indigo-500"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl border border-white/5 p-4 flex gap-3 items-start">
                        <Activity className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                            {component.config.mode === 'interference' ?
                                "Observeer destructieve en constructieve interferentie. Bij een kleinere spleetafstand d worden de maxima verder uit elkaar geplaatst." :
                                "De amplitude is maximaal bij de buiken en nul bij de knopen."
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
