import "mafs/core.css";
import "mafs/font.css";

import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import { motion } from "framer-motion";
import { Search, TrendingUp } from "lucide-react";
import {
    Coordinates,
    Mafs,
    Plot,
    Point,
    useMovablePoint,
    Vector
} from "mafs";
import * as math from "mathjs";
import React, { useCallback, useMemo, useState } from "react";
import { InlineMath } from "react-katex";
import { z } from "zod";

type MathComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'math-analysis' | 'math-geometry' | 'math-motion' }>;

interface MathEngineProps {
    component: MathComponent;
    onInteraction?: (newConfig: MathComponent['config']) => void;
    mastery?: 'novice' | 'competent' | 'expert';
}

const AnalysisModule: React.FC<{ config: Extract<MathComponent, { type: 'math-analysis' }>['config'] }> = ({ config }) => {
    const [params, setParams] = useState<Record<string, number>>(config.parameters || {});

    // Movable point for tangent exploration
    const tangentPoint = useMovablePoint([1, 0], {
        constrain: ([x]) => [x, 0] // Constrain to x-axis
    });

    const compiled = useMemo(() => {
        try {
            return math.compile(config.function);
        } catch {
            return null;
        }
    }, [config.function]);

    const fn = useCallback((x: number) => {
        if (!compiled) return x;
        try {
            return compiled.evaluate({ x, ...params });
        } catch {
            return 0;
        }
    }, [compiled, params]);

    // Calculate derivative at tangentPoint.x using numerical approximation
    const derivativeAtPoint = useMemo(() => {
        const x = tangentPoint.x;
        const h = 0.001;
        return (fn(x + h) - fn(x)) / h;
    }, [fn, tangentPoint.x]);

    const tangentY = fn(tangentPoint.x);

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-1 min-h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-obsidian-900/50 backdrop-blur-sm relative">
                <Mafs
                    viewBox={{ x: config.range || [-5, 5], y: [-5, 5] }}
                    pan={false}
                >
                    <Coordinates.Cartesian />
                    <Plot.OfX y={fn} color="#6366f1" />

                    {config.features.includes('tangent') && (
                        <>
                            {tangentPoint.element}
                            <Point x={tangentPoint.x} y={tangentY} color="#f59e0b" />
                            <Plot.OfX
                                y={(x) => derivativeAtPoint * (x - tangentPoint.x) + tangentY}
                                color="#f59e0b"
                                opacity={0.6}
                                style="dashed"
                            />
                        </>
                    )}
                </Mafs>

                {/* Overlay Info */}
                <div className="absolute top-4 right-4 p-3 bg-obsidian-950/80 border border-white/10 rounded-xl backdrop-blur-md shadow-2xl">
                    <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Live Calculus</div>
                    <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium text-white flex items-center gap-2">
                            <InlineMath>{`f(x) = ${config.function}`}</InlineMath>
                        </div>
                        {config.features.includes('tangent') && (
                            <div className="text-sm text-amber-400 font-mono">
                                <InlineMath>{`f'(${tangentPoint.x.toFixed(2)}) \\approx ${derivativeAtPoint.toFixed(2)}`}</InlineMath>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            {Object.keys(params).length > 0 && (
                <div className="grid grid-cols-2 gap-3 p-4 bg-obsidian-900/30 border border-white/5 rounded-xl">
                    {Object.entries(params).map(([key, val]) => (
                        <div key={key} className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-medium text-white/60">
                                <span>Level Parameter: {key}</span>
                                <span className="text-indigo-400">{val.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="-10"
                                max="10"
                                step="0.1"
                                value={val}
                                onChange={(e) => {
                                    const next = { ...params, [key]: parseFloat(e.target.value) };
                                    setParams(next);
                                }}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const GeometryModule: React.FC<{ config: Extract<MathComponent, { type: 'math-geometry' }>['config'] }> = ({ config }) => {
    // Basic implementation for vector visualization
    const p1 = useMovablePoint([1, 1]);
    const p2 = useMovablePoint([2, -1]);

    const dotProduct = p1.x * p2.x + p1.y * p2.y;

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-1 min-h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-obsidian-900/50 backdrop-blur-sm relative">
                <Mafs pan={true}>
                    <Coordinates.Cartesian />
                    <Vector tail={[0, 0]} tip={[p1.x, p1.y]} color="#3b82f6" weight={3} />
                    <Vector tail={[0, 0]} tip={[p2.x, p2.y]} color="#ec4899" weight={3} />
                    {p1.element}
                    {p2.element}
                </Mafs>

                <div className="absolute top-4 right-4 p-3 bg-obsidian-950/80 border border-white/10 rounded-xl backdrop-blur-md shadow-2xl space-y-2">
                    <div className="text-[10px] text-white/50 uppercase tracking-widest">Vector Analysis</div>
                    <div className="space-y-1">
                        <div className="text-xs text-blue-400">
                            <InlineMath>{`\\vec{a} = \\begin{pmatrix} ${p1.x.toFixed(1)} \\\\ ${p1.y.toFixed(1)} \\end{pmatrix}`}</InlineMath>
                        </div>
                        <div className="text-xs text-pink-400">
                            <InlineMath>{`\\vec{b} = \\begin{pmatrix} ${p2.x.toFixed(1)} \\\\ ${p2.y.toFixed(1)} \\end{pmatrix}`}</InlineMath>
                        </div>
                        {config.interaction === 'dot-product' && (
                            <div className="pt-1 border-t border-white/10 font-bold text-sm text-white">
                                <InlineMath>{`\\vec{a} \\cdot \\vec{b} = ${dotProduct.toFixed(2)}`}</InlineMath>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MotionModule: React.FC<{ config: Extract<MathComponent, { type: 'math-motion' }>['config'] }> = ({ config }) => {
    const [time, setTime] = useState(0);

    // Simple animation loop for the unit circle
    React.useEffect(() => {
        let frame: number;
        const animate = (t: number) => {
            setTime(t / 1000);
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, []);

    const x = Math.cos(time);
    const y = Math.sin(time);

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-1 min-h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-obsidian-900/50 backdrop-blur-sm relative">
                <Mafs>
                    <Coordinates.Cartesian />
                    {config.mode === 'unit-circle' && (
                        <>
                            <Plot.OfX y={(x) => Math.sqrt(Math.max(0, 1 - x * x))} color="#ffffff20" />
                            <Plot.OfX y={(x) => -Math.sqrt(Math.max(0, 1 - x * x))} color="#ffffff20" />
                            <Vector tail={[0, 0]} tip={[x, y]} color="#10b981" />
                            <Point x={x} y={y} color="#10b981" />
                            {config.showVectors && (
                                <Vector tail={[x, y]} tip={[x - y, y + x]} color="#f43f5e" /> // Velocity vector
                            )}
                        </>
                    )}
                </Mafs>

                <div className="absolute top-4 right-4 p-3 bg-obsidian-950/80 border border-white/10 rounded-xl backdrop-blur-md shadow-2xl">
                    <div className="text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Motion
                    </div>
                    <div className="text-sm font-mono text-emerald-400">
                        <InlineMath>{`(\\cos t, \\sin t)`}</InlineMath>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MathEngine: React.FC<MathEngineProps> = ({ component, mastery }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 w-full"
        >
            <div className="flex items-center gap-3 mb-2 px-1">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                        Wiskunde B Analysis
                    </h3>
                    <p className="text-xs text-white/40 font-medium">
                        {component.type.replace('math-', '').toUpperCase()} Engine • VWO Syllabus 2025
                    </p>
                </div>
            </div>

            <div className="w-full">
                {component.type === 'math-analysis' && (
                    <AnalysisModule config={component.config} />
                )}
                {component.type === 'math-geometry' && (
                    <GeometryModule config={component.config} />
                )}
                {component.type === 'math-motion' && (
                    <MotionModule config={component.config} />
                )}
            </div>

            {/* Socratic Context Footer */}
            {mastery && (
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-white/20 px-2">
                    <Search className="w-3 h-3" />
                    <span>Mode: {mastery} Deep-Visualisation Active</span>
                </div>
            )}
        </motion.div>
    );
};
