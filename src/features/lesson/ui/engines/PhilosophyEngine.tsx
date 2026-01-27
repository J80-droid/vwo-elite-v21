import 'reactflow/dist/style.css';

import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import { AnimatePresence, motion } from "framer-motion";
import {
    Brain,
    CheckCircle2,
    Compass,
    Cpu,
    GitBranch,
    History,
    Network,
    Scale,
    ShieldAlert,
    Zap
} from "lucide-react";
import React, { useState } from "react";
import ReactFlow, {
    Background,
    Controls,
    Edge,
    MarkerType,
    Node
} from "reactflow";
import { z } from "zod";

type PhilosophyComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'philosophy-logic' | 'philosophy-thought-experiment' | 'philosophy-concept-map' }>;

interface PhilosophyEngineProps {
    component: PhilosophyComponent;
    mastery?: 'novice' | 'competent' | 'expert';
}

/**
 * Logic & Argumentation Module
 * Syllogism reconstruction and fallacy detection using React Flow.
 */
const LogicModule: React.FC<{ config: Extract<PhilosophyComponent, { type: 'philosophy-logic' }>['config'] }> = ({ config }) => {
    const [nodes, setNodes] = useState<Node[]>(config.nodes as Node[] || [
        {
            id: 'p1',
            data: { label: config.premises[0] || 'Premisse 1' },
            position: { x: 50, y: 50 },
            className: "p-4 bg-indigo-500/10 border border-indigo-500/40 text-white rounded-xl text-xs font-serif"
        },
        {
            id: 'p2',
            data: { label: config.premises[1] || 'Premisse 2' },
            position: { x: 450, y: 50 },
            className: "p-4 bg-pink-500/10 border border-pink-500/40 text-white rounded-xl text-xs font-serif"
        },
        {
            id: 'c',
            data: { label: config.conclusion || 'Conclusie' },
            position: { x: 250, y: 200 },
            className: "p-4 bg-emerald-500/10 border border-emerald-500/40 text-white rounded-xl text-xs font-serif font-bold shadow-lg shadow-emerald-500/20"
        }
    ]);

    const [edges] = useState<Edge[]>(config.edges as Edge[] || [
        { id: 'e1-c', source: 'p1', target: 'c', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e2-c', source: 'p2', target: 'c', animated: true, markerEnd: { type: MarkerType.ArrowClosed } }
    ]);

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Logische Reconstructie</h4>
                        <p className="text-[10px] text-white/40 font-medium">Task: {config.task.replace('-', ' ')}</p>
                    </div>
                </div>
                <div className="px-2 py-1 bg-white/5 rounded text-[9px] text-indigo-300 font-bold border border-indigo-500/20">
                    DOMEIN A
                </div>
            </div>

            <div className="h-[300px] w-full bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={(_changes) => setNodes((nds) => nds.map(n => ({ ...n })))}
                    fitView
                >
                    <Background color="#333" gap={16} />
                    <Controls />
                </ReactFlow>
            </div>

            {config.task === 'validity-test' && (
                <div className="flex justify-center pt-2">
                    <button className="px-6 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-full border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        Check Validity
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * Thought Experiment Simulator
 * Narrative branching for ethical/anthropological dilemmas.
 */
const ThoughtExperimentModule: React.FC<{ config: Extract<PhilosophyComponent, { type: 'philosophy-thought-experiment' }>['config'] }> = ({ config }) => {
    const [choice, setChoice] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                {config.scenario === 'chinese-room' ? <Cpu size={120} /> : <Compass size={120} />}
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                        <Brain className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Gedachte-Experiment</h4>
                        <p className="text-[10px] text-white/40 font-medium capitalize">{config.scenario.replace('-', ' ')} Simulator</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                    <p className="text-sm text-white/90 leading-relaxed font-serif italic text-center">
                        "{config.dilemma}"
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {config.perspectives.map((perspectief) => (
                        <button
                            key={perspectief}
                            onClick={() => setChoice(perspectief)}
                            className={`
                                p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 group
                                ${choice === perspectief
                                    ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'}
                            `}
                        >
                            <Scale className={`w-5 h-5 ${choice === perspectief ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`} />
                            <span className="text-xs font-bold text-white tracking-tight">{perspectief}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence>
                    {choice && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center"
                        >
                            <p className="text-xs text-emerald-100 font-medium">
                                Je hebt gekozen voor het perspectief van <span className="font-bold underline decoration-emerald-500/50">{choice}</span>.
                                Hoe zou deze filosoof reageren op de technische implicaties?
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

/**
 * Concept & Ontologie Engine
 * Visual boundary mapping for defining concepts.
 */
const ConceptMapModule: React.FC<{ config: Extract<PhilosophyComponent, { type: 'philosophy-concept-map' }>['config'] }> = ({ config }) => {
    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <Network className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Concept Mapper</h4>
                        <p className="text-[10px] text-white/40 font-medium">Mode: {config.mode}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-8 py-4">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="p-6 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full w-40 h-40 flex items-center justify-center text-center shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                >
                    <span className="text-sm font-black text-white uppercase tracking-widest leading-tight">
                        {config.centralConcept}
                    </span>
                </motion.div>

                <div className="flex flex-wrap justify-center gap-3">
                    {config.relatedConcepts.map((rel, i) => (
                        <motion.div
                            key={rel}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 cursor-default transition-all"
                        >
                            {rel}
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-3 items-start">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                    Trek lijnen tussen de begrippen om hun onderlinge {config.mode === 'relate' ? 'verwantschap' : 'verschillen'} te visualiseren.
                </p>
            </div>
        </div>
    );
};

export const PhilosophyEngine: React.FC<PhilosophyEngineProps> = ({ component, mastery }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 w-full"
        >
            <div className="flex items-center gap-4 mb-2 px-1">
                <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
                    <Brain className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                        Filosofie Elite Engine
                    </h3>
                    <p className="text-[10px] text-pink-400/60 font-black uppercase tracking-widest flex items-center gap-2">
                        Mens & Techniek <span className="w-1 h-1 bg-pink-500 rounded-full" /> Curriculum 2025
                    </p>
                </div>
            </div>

            <div className="w-full">
                {component.type === 'philosophy-logic' && (
                    <LogicModule config={component.config} />
                )}
                {component.type === 'philosophy-thought-experiment' && (
                    <ThoughtExperimentModule config={component.config} />
                )}
                {component.type === 'philosophy-concept-map' && (
                    <ConceptMapModule config={component.config} />
                )}
            </div>

            {/* Socratic Context Footer */}
            {mastery && (
                <div className="flex items-center justify-between px-2 pt-2">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-white/20">
                        <History className="w-3 h-3" />
                        <span>Socratic Mode: {mastery} Deep-Reasoning Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500/40" />
                        <span className="text-[9px] font-black text-white/10 uppercase italic tracking-tighter shadow-sm shadow-emerald-500/5">Verified Philosophy v6.0</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
