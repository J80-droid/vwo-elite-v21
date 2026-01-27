import { MeshViewer } from "@shared/ui/components/MeshViewer";
import { AnimatePresence,motion } from "framer-motion";
import {
Atom,
Box, Brain, Code, Eye, Filter, Heart, Image,
    Mic, Search,
    TestTube, UserCheck, Video,     Zap} from "lucide-react";
import React, { useState } from "react";

import { NeuralNode } from "./NeuralNode";

const PILLARS = [
    { id: "fast", label: "Fast", icon: Zap, color: "text-yellow-400", angle: 0 },
    { id: "reasoning", label: "Reasoning", icon: Brain, color: "text-blue-400", angle: 25.7 },
    { id: "vision", label: "Vision", icon: Eye, color: "text-purple-400", angle: 51.4 },
    { id: "code", label: "Code", icon: Code, color: "text-cyan-400", angle: 77.1 },
    { id: "embedding", label: "Embedding", icon: Search, color: "text-green-400", angle: 102.8 },
    { id: "audio", label: "Auditief", icon: Mic, color: "text-pink-400", angle: 128.5 },
    { id: "agentic", label: "Agentic", icon: UserCheck, color: "text-orange-400", angle: 154.2 },
    { id: "discriminative", label: "Discriminatief", icon: Filter, color: "text-indigo-400", angle: 180 },
    { id: "generative", label: "Generatief", icon: Image, color: "text-rose-400", angle: 205.7 },
    { id: "scientific", label: "Science", icon: TestTube, color: "text-teal-400", angle: 231.4 },
    { id: "emotional", label: "Emotioneel", icon: Heart, color: "text-red-400", angle: 257.1 },
    { id: "spatial", label: "Ruimtelijk", icon: Box, color: "text-sky-400", angle: 282.8 },
    { id: "temporal", label: "Temporeel", icon: Video, color: "text-amber-400", angle: 308.5 },
    { id: "quantum", label: "Quantum", icon: Atom, color: "text-violet-400", angle: 334.2 },
];

export const NeuralDashboard: React.FC = () => {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    return (
        <div className="flex-1 relative bg-[#050505] overflow-hidden flex items-center justify-center p-4">
            {/* Background Neural Grid */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1)_0%,transparent_70%)]" />
                <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <div className="relative w-full max-w-4xl aspect-square flex items-center justify-center">
                {/* Central Neural Core */}
                <motion.div
                    className="relative z-20 w-48 h-48 md:w-64 md:h-64 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl shadow-[0_0_50px_rgba(0,240,255,0.1)] flex items-center justify-center overflow-hidden"
                    animate={{
                        boxShadow: hoveredNode
                            ? `0 0 60px rgba(0,240,255,0.3)`
                            : `0 0 40px rgba(0,240,255,0.1)`
                    }}
                >
                    <div className="absolute inset-0 pointer-events-none">
                        <MeshViewer url="/models/ai/neural_brain.glb" autoRotate shadows={false} />
                    </div>
                    <div className="relative z-10 text-center space-y-1">
                        <h2 className="text-sm font-black text-electric uppercase tracking-tighter opacity-60">Elite Brain</h2>
                        <div className="text-2xl font-black text-white uppercase tracking-widest">Active</div>
                    </div>
                </motion.div>

                {/* Intelligence Nodes */}
                {PILLARS.map((pillar) => (
                    <NeuralNode
                        key={pillar.id}
                        pillar={pillar}
                        radius={window.innerWidth > 768 ? 320 : 160}
                        isHovered={hoveredNode === pillar.id}
                        onHover={() => setHoveredNode(pillar.id)}
                        onLeave={() => setHoveredNode(null)}
                    />
                ))}

                {/* Global Connections Layer (Can be svg for drawing lines) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    {PILLARS.map((pillar) => {
                        const rad = (pillar.angle * Math.PI) / 180;
                        const r = window.innerWidth > 768 ? 320 : 160;
                        const isThisHovered = hoveredNode === pillar.id;
                        return (
                            <motion.line
                                key={`line-${pillar.id}`}
                                x1="50%"
                                y1="50%"
                                x2={`${50 + (r / 8) * Math.cos(rad)}%`}
                                y2={`${50 + (r / 8) * Math.sin(rad)}%`}
                                stroke="currentColor"
                                strokeWidth={isThisHovered ? "2" : "1"}
                                className={`${pillar.color} ${isThisHovered ? 'opacity-100' : 'opacity-20'} transition-all duration-300`}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, delay: pillar.angle / 360 }}
                            />
                        );
                    })}
                </svg>
            </div>

            {/* Info Overlay */}
            <AnimatePresence>
                {hoveredNode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-12 right-12 p-6 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl w-64 z-30"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-white/5">
                                {React.createElement(PILLARS.find(p => p.id === hoveredNode)!.icon, { size: 24, className: PILLARS.find(p => p.id === hoveredNode)!.color })}
                            </div>
                            <h3 className="text-xl font-bold text-white capitalize">{hoveredNode}</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            Geavanceerde {hoveredNode} intelligentie geprotocolleerd voor VWO Elite niveau.
                        </p>
                        <div className="flex justify-between items-center text-[10px] font-mono text-electric">
                            <span>STATUS: OPTIMIZED</span>
                            <span>100% CAP</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
