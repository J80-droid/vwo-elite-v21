import 'reactflow/dist/style.css';

import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import { motion, Reorder } from "framer-motion";
import {
    BookOpen,
    CheckCircle2,
    FileText,
    GitBranch,
    History,
    Type
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

type DutchComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'dutch-argumentation' | 'dutch-text-anatomy' | 'dutch-style' }>;

interface DutchEngineProps {
    component: DutchComponent;
    mastery?: 'novice' | 'competent' | 'expert';
}

/**
 * Argumentation & Logica Engine
 * Tree visualization for mapping arguments and fallacies.
 */
const ArgumentationModule: React.FC<{ config: Extract<DutchComponent, { type: 'dutch-argumentation' }>['config'] }> = ({ config }) => {
    const initialNodes: Node[] = config.nodes as Node[] || [
        {
            id: '1',
            type: 'input',
            data: { label: 'Hoofdstelling' },
            position: { x: 250, y: 0 },
            style: { background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#fff', borderRadius: '12px' }
        },
        {
            id: '2',
            data: { label: 'Argument voor' },
            position: { x: 100, y: 100 },
            style: { background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#fff', borderRadius: '12px' }
        },
        {
            id: '3',
            data: { label: 'Argument tegen' },
            position: { x: 400, y: 100 },
            style: { background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fff', borderRadius: '12px' }
        }
    ];

    const initialEdges: Edge[] = config.edges as Edge[] || [
        { id: 'e1-2', source: '1', target: '2', label: 'onderbouwt', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e1-3', source: '1', target: '3', label: 'weerlegt', markerEnd: { type: MarkerType.ArrowClosed } }
    ];

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges] = useState<Edge[]>(initialEdges);

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Argumentatie Creator</h4>
                        <p className="text-[10px] text-white/40 font-medium">Model: {config.structureType.toUpperCase()}</p>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={(_changes) => setNodes((nds) => nds.map(n => ({ ...n })))} // simplified
                    fitView
                >
                    <Background color="#333" gap={16} />
                    <Controls />
                </ReactFlow>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                <div className="text-[10px] text-white/40 uppercase font-black">Bronfragment</div>
                <p className="text-xs text-white/80 leading-relaxed font-serif italic line-clamp-3">
                    {config.textSnippet}
                </p>
            </div>
        </div>
    );
};

/**
 * Tekst Anatomie Engine
 * Paragraph manipulation and functional labeling.
 */
const TextAnatomyModule: React.FC<{ config: Extract<DutchComponent, { type: 'dutch-text-anatomy' }>['config'] }> = ({ config }) => {
    const [paragraphs, setParagraphs] = useState(config.paragraphs);
    const [labeledFunctions, setLabeledFunctions] = useState<Record<number, string>>({});

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Tekst Anatomie</h4>
                        <p className="text-[10px] text-white/40 font-medium">Mode: {config.mode.replace('-', ' ')}</p>
                    </div>
                </div>
            </div>

            {config.mode === 'reorder' ? (
                <Reorder.Group axis="y" values={paragraphs} onReorder={setParagraphs} className="space-y-3">
                    {paragraphs.map((p, _idx) => (
                        <Reorder.Item
                            key={p}
                            value={p}
                            className="p-4 bg-white/5 border border-white/10 rounded-xl cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                        >
                            <span className="text-xs text-white/80 font-serif leading-relaxed line-clamp-2">{p}</span>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            ) : (
                <div className="space-y-4">
                    {paragraphs.map((p, idx) => (
                        <div key={idx} className="group relative transition-all">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl group-hover:bg-white/10">
                                <span className="text-xs text-white/80 font-serif leading-relaxed">{p}</span>
                                {labeledFunctions[idx] && (
                                    <div className="mt-2 text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded inline-block font-bold">
                                        {labeledFunctions[idx].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 absolute -right-2 top-2 flex flex-col gap-1 transition-opacity">
                                {config.labels?.map(label => (
                                    <button
                                        key={label}
                                        onClick={() => setLabeledFunctions({ ...labeledFunctions, [idx]: label })}
                                        className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[9px] text-white hover:bg-emerald-500 hover:text-black font-bold uppercase"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Stijl & Retorica Engine
 * Sentence refinement and identification.
 */
const StyleModule: React.FC<{ config: Extract<DutchComponent, { type: 'dutch-style' }>['config'] }> = ({ config }) => {
    const [refined, setRefined] = useState(config.inputSentence);
    const [solved, setSolved] = useState(false);

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                        <Type className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Stijl & Retorica</h4>
                        <p className="text-[10px] text-white/40 font-medium">Focus: {config.problemType}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <div className="text-[9px] text-red-400 uppercase font-black mb-1">Oorspronkelijk ({config.problemType})</div>
                    <p className="text-xs text-white/60 font-serif line-through decoration-red-500/50">{config.inputSentence}</p>
                </div>

                <div className="relative group">
                    <textarea
                        value={refined}
                        onChange={(e) => setRefined(e.target.value)}
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white font-serif focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all resize-none"
                        placeholder="Herschrijf de zin hier..."
                    />
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => setSolved(true)}
                        className="px-8 py-2.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-full border border-pink-500/30 text-xs font-bold transition-all flex items-center gap-2 group"
                    >
                        <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Refinement Toepassen
                    </button>
                </div>

                {solved && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black animate-pulse">
                            Stijlvol Verbeterd • +15 EQ
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export const DutchEngine: React.FC<DutchEngineProps> = ({ component, mastery }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 w-full"
        >
            <div className="flex items-center gap-3 mb-2 px-1">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <BookOpen className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                        Nederlands Elite Engine
                    </h3>
                    <p className="text-xs text-white/40 font-medium">
                        Domein A, C, D & E • Examencurriculum 2025
                    </p>
                </div>
            </div>

            <div className="w-full">
                {component.type === 'dutch-argumentation' && (
                    <ArgumentationModule config={component.config} />
                )}
                {component.type === 'dutch-text-anatomy' && (
                    <TextAnatomyModule config={component.config} />
                )}
                {component.type === 'dutch-style' && (
                    <StyleModule config={component.config} />
                )}
            </div>

            {/* Socratic Context Footer */}
            {mastery && (
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-white/20">
                        <History className="w-3 h-3" />
                        <span>Mode: {mastery} Didactiek Geactiveerd</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
