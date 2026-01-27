import 'katex/dist/katex.min.css';

import { useDataExport } from "@shared/hooks/useDataExport";
import { useEngineState } from "@shared/hooks/useEngineState";
import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    Download,
    Maximize2,
    RotateCcw,
    Settings2
} from "lucide-react";
import Matter from "matter-js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { InlineMath } from 'react-katex';
import { z } from "zod";

type InteractiveComponent = z.infer<typeof InteractiveComponentSchema>;
type ComponentConfig<T extends InteractiveComponent['type']> = Extract<InteractiveComponent, { type: T }>['config'];

export interface PhysicsSliderProps {
    label: string;
    symbol: string;
    unit: string;
    value: number;
    min?: number;
    max?: number;
    onChange: (val: number) => void;
}

const PhysicsSlider: React.FC<PhysicsSliderProps> = ({ label, symbol, unit, value, min = 0, max = 100, onChange }) => (
    <div className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm group hover:border-electric/50 transition-all duration-300">
        <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-500 group-hover:text-slate-300">
            <div className="flex items-center gap-2">
                <Settings2 size={12} className="text-electric/50" />
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="text-electric font-mono">{symbol} = {value.toFixed(1)}</span>
                <span className="text-slate-600 ml-1">{unit}</span>
            </div>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step="0.1"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-electric hover:accent-indigo-400 transition-all"
        />
    </div>
);

export const PhysicsEngine: React.FC<{
    config: ComponentConfig<"physics-simulation">;
    onUpdate?: (c: ComponentConfig<"physics-simulation">) => void;
    allowedControls?: string[] | 'all';
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config, onUpdate, allowedControls = 'all', mastery = 'novice' }) => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const [key, setKey] = useState(0);
    const { exportToCSV } = useDataExport();

    // Persist simulation parameters
    const [params, setParams] = useEngineState<Record<string, number>>(
        `physics-params-${config.scene}`,
        (config.parameters || {}) as Record<string, number>
    );

    const handleChange = (k: string, val: number) => {
        const newParams = { ...params, [k]: val };
        setParams(newParams);
        onUpdate?.({ ...config, parameters: newParams });
    };

    const handleReset = () => setKey(prev => prev + 1);

    useEffect(() => {
        if (!sceneRef.current) return;

        const Engine = Matter.Engine,
            Render = Matter.Render,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite,
            Constraint = Matter.Constraint,
            Mouse = Matter.Mouse,
            MouseConstraint = Matter.MouseConstraint;

        const engine = Engine.create();
        engineRef.current = engine;

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: 700,
                height: 400,
                wireframes: false,
                background: 'transparent',
                showAngleIndicator: mastery !== 'novice',
                showVelocity: mastery === 'expert'
            }
        });
        renderRef.current = render;

        const width = 700;
        const height = 400;
        const theme = { ground: '#1a1a1e', accent: '#6366f1', object: '#F59E0B' };

        const ground = Bodies.rectangle(width / 2, height + 10, width, 40, { isStatic: true, render: { fillStyle: theme.ground } });
        Composite.add(engine.world, [ground]);

        const mass = params.mass || 10;
        const gravity = (params.gravity || 9.8) / 10;
        engine.gravity.y = gravity;

        if (config.scene === "slope") {
            const angleRad = ((params.angle || 30) * Math.PI) / 180;
            const wedge = Bodies.rectangle(width / 2, height - 80, 500, 20, {
                isStatic: true,
                angle: -angleRad,
                render: { fillStyle: '#2d2d35', strokeStyle: theme.accent, lineWidth: 2 }
            });
            const box = Bodies.rectangle(width / 2 - 125, height - 200, 40, 40, {
                friction: (params.friction || 0.1) * 0.1,
                density: mass * 0.001,
                render: { fillStyle: theme.object }
            });
            Composite.add(engine.world, [wedge, box]);
        }
        else if (config.scene === "pendulum") {
            const pivotX = width / 2;
            const pivotY = 80;
            const len = (params.length || 100) * 2;
            const angle = (params.angle || 45) * Math.PI / 180;
            const bob = Bodies.circle(pivotX + len * Math.sin(angle), pivotY + len * Math.cos(angle), 20, {
                density: mass * 0.001,
                render: { fillStyle: theme.object }
            });
            const rod = Constraint.create({
                pointA: { x: pivotX, y: pivotY },
                bodyB: bob,
                length: len,
                stiffness: 1,
                render: { strokeStyle: 'rgba(255,255,255,0.4)', lineWidth: 2 }
            });
            Composite.add(engine.world, [bob, rod]);
        }
        else if (config.scene === "spring") {
            const box = Bodies.rectangle(width / 2, 200, 50, 50, { density: mass * 0.001, frictionAir: 0.01, render: { fillStyle: theme.object } });
            const spring = Constraint.create({
                pointA: { x: width / 2, y: 50 },
                bodyB: box,
                length: 150,
                stiffness: (params.k || 20) * 0.001,
                render: { strokeStyle: theme.accent, lineWidth: 4, type: 'spring' }
            });
            Composite.add(engine.world, [box, spring]);
        }
        else if (config.scene === "projectile") {
            const f = (params.force || 10) * 0.5;
            const a = (params.angle || 45) * Math.PI / 180;
            const ball = Bodies.circle(50, height - 50, 15, { density: mass * 0.001, render: { fillStyle: theme.object } });
            Composite.add(engine.world, ball);
            Matter.Body.setVelocity(ball, { x: Math.cos(a) * f, y: -Math.sin(a) * f });
        }

        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
        Composite.add(engine.world, mouseConstraint);

        Render.run(render);
        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);

        return () => {
            Render.stop(render);
            Runner.stop(runner);
            if (render.canvas) render.canvas.remove();
            engineRef.current = null;
        };
    }, [config.scene, key, mastery, params]);

    const formulas = useMemo(() => {
        switch (config.scene) {
            case "slope": return { title: "Helling-Mechanica", latex: ["F_z = m \\cdot g", "F_{nx} = F_z \\cdot \\sin(\\alpha)", "F_n = F_z \\cdot \\cos(\\alpha)"] };
            case "pendulum": return { title: "Slinger-Harmonica", latex: ["T = 2\\pi\\sqrt{\\frac{L}{g}}", "E_{pot} = m \\cdot g \\cdot h"] };
            case "spring": return { title: "Veerkracht & Energie", latex: ["F_v = C \\cdot u", "E_v = \\frac{1}{2}C \\cdot u^2", "T = 2\\pi\\sqrt{\\frac{m}{C}}"] };
            case "projectile": return { title: "Kogelbaan-Dynamica", latex: ["x(t) = v_0 \\cos(\\alpha) \\cdot t", "y(t) = v_0 \\sin(\\alpha) \\cdot t - \\frac{1}{2}g \\cdot t^2"] };
            default: return null;
        }
    }, [config.scene]);

    const visibleParams = Object.keys(params).filter(k => allowedControls === 'all' || allowedControls.includes(k));

    return (
        <div className="flex flex-col gap-6 bg-obsidian-950/40 border border-white/5 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-electric/10 rounded-2xl border border-electric/20 text-electric shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                            {formulas?.title}
                            <span className="text-[10px] not-italic font-mono bg-white/5 px-2 py-0.5 rounded text-white/40 tracking-normal uppercase">{config.scene}</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Syllabus 2025 • Physics Engine</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => exportToCSV([params], `physics-${config.scene}-params`)}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        title="Export Parameters"
                    >
                        <Download size={18} />
                    </button>
                    <button onClick={handleReset} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90" title="Herstart Simulatie">
                        <RotateCcw size={18} />
                    </button>
                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                        <Maximize2 size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                <div className="lg:col-span-8 relative">
                    <div ref={sceneRef} className="w-full aspect-video bg-obsidian-900 rounded-[2rem] border border-white/10 shadow-inner overflow-hidden relative cursor-crosshair">
                        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
                        <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20 pointer-events-none bg-black/40 p-3 rounded-xl backdrop-blur-md border border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Object Massa</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Force Vectors</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4">
                    <AnimatePresence mode="wait">
                        <motion.div key={config.scene} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-[2rem] backdrop-blur-xl">
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block mb-3">Relevant Concepts</span>
                            <div className="space-y-4">
                                {formulas?.latex.map((lat, idx) => (
                                    <div key={idx} className="bg-black/20 p-2 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                                        <InlineMath math={lat} />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                        {visibleParams.map(k => {
                            const labels: Record<string, { l: string, s: string, u: string, min: number, max: number }> = {
                                mass: { l: 'Massa', s: 'm', u: 'kg', min: 1, max: 100 },
                                gravity: { l: 'Zwaartekracht', s: 'g', u: 'm/s²', min: 0, max: 20 },
                                angle: { l: 'Hoek', s: '\\alpha', u: '°', min: 0, max: 90 },
                                force: { l: 'Kracht', s: 'F', u: 'N', min: 0, max: 100 },
                                friction: { l: 'Wrijving', s: '\\mu', u: '', min: 0, max: 1 },
                                length: { l: 'Lengte', s: 'L', u: 'm', min: 10, max: 200 },
                                k: { l: 'Veerconstante', s: 'C', u: 'N/m', min: 1, max: 100 }
                            };
                            const info = labels[k] || { l: k, s: k, u: '', min: 0, max: 100 };
                            return <PhysicsSlider key={k} label={info.l} symbol={info.s} unit={info.u} min={info.min} max={info.max} value={params[k] ?? 0} onChange={(v) => handleChange(k, v)} />;
                        })}
                    </div>
                </div>
            </div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric/5 rounded-full blur-[120px] -z-10 animate-pulse" />
        </div>
    );
};
