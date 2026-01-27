import 'reactflow/dist/style.css';
import 'katex/dist/katex.min.css';

import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import { motion } from "framer-motion";
import {
    Activity,
    Dna,
    LayoutGrid,
    Network,
    Search,
    Share2
} from "lucide-react";
import * as NGL from "ngl";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { InlineMath } from "react-katex";
import ReactFlow, {
    Background,
    Controls,
    Edge,
    MarkerType,
    Node} from "reactflow";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { z } from "zod";

type InteractiveComponent = z.infer<typeof InteractiveComponentSchema>;
type ComponentConfig<T extends InteractiveComponent['type']> = Extract<InteractiveComponent, { type: T }>['config'];

// --- 1. MOLECULAR & CELLULAR ENGINE (NIVEAU M) ---
export const CellProcessEngine: React.FC<{
    config: ComponentConfig<"biology-process">;
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [step, setStep] = useState(0);
    const steps = config.steps || [
        "Binding van RNA-polymerase aan de promoter",
        "Transcriptie: vorming van pre-mRNA",
        "Splicing: verwijderen van introns",
        "Export naar het cytoplasma",
        "Translatie: vorming van de aminozuurketen"
    ];

    useEffect(() => {
        if (!containerRef.current || !config.moleculeData) return;
        const stage = new NGL.Stage(containerRef.current, { backgroundColor: "transparent" });
        stage.loadFile(`rcsb://${config.moleculeData}`).then(comp => {
            if (comp) {
                (comp as NGL.StructureComponent).addRepresentation("ball+stick", { colorScheme: "element" });
                stage.autoView();
            }
        });
        return () => stage.dispose();
    }, [config.moleculeData]);

    return (
        <div className="flex flex-col gap-6 bg-obsidian-950/40 border border-white/5 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <Dna size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                            {config.process === 'protein-synthesis' ? 'Eiwitsynthese' : 'Cellulair Proces'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Niveau M • Moleculaire Dynamica</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 relative">
                    <div className="w-full aspect-video bg-black/40 rounded-[2rem] border border-white/10 overflow-hidden relative">
                        {config.moleculeData ? (
                            <div ref={containerRef} className="w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                                <Search size={48} className="animate-pulse" />
                                <span className="text-xs uppercase font-black tracking-widest">Visualizing {config.process}...</span>
                                <div className="flex gap-2">
                                    <div className="w-12 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                                        <motion.div animate={{ x: [-48, 48] }} transition={{ repeat: Infinity, duration: 2 }} className="w-full h-full bg-emerald-500" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem]">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-3">Stappenplan Proces</span>
                        <div className="space-y-3">
                            {steps.map((s, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: step >= i ? 1 : 0.3, x: step === i ? 5 : 0 }}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${step === i ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-black/20 border-white/5'}`}
                                >
                                    <span className="text-[10px] font-black font-mono text-emerald-500">{i + 1}</span>
                                    <span className="text-[11px] font-bold text-slate-300 leading-tight">{s}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setStep(prev => Math.max(0, prev - 1))}
                            aria-label="Ga naar vorige stap"
                            className="flex-1 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Vorige
                        </button>
                        <button
                            onClick={() => setStep(prev => Math.min(steps.length - 1, prev + 1))}
                            aria-label="Ga naar volgende stap"
                            className="flex-[2] p-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-2xl text-xs font-black uppercase tracking-widest text-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
                        >
                            Volgende Stap
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 2. PHYSIOLOGICAL SYSTEM ENGINE (NIVEAU O) ---
export const PhysiologyEngine: React.FC<{
    config: ComponentConfig<"biology-feedback">;
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config, mastery }) => {
    const isNovice = mastery === 'novice';

    const initialNodes: Node[] = (config.nodes as unknown as Node[]) || [
        { id: 'sensor', position: { x: 50, y: 150 }, data: { label: 'Sensor' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #3b82f6', borderRadius: '12px', padding: '10px' } },
        { id: 'center', position: { x: 250, y: 150 }, data: { label: 'Regelcentrum' }, style: { background: '#1e293b', color: '#6366f1', border: '1px solid #6366f1', borderRadius: '12px', padding: '10px' } },
        { id: 'effector', position: { x: 450, y: 150 }, data: { label: 'Effector' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #10b981', borderRadius: '12px', padding: '10px' } },
    ];

    const initialEdges: Edge[] = (config.edges as unknown as Edge[]) || [
        { id: 'e1', source: 'sensor', target: 'center', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e2', source: 'center', target: 'effector', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e3', source: 'effector', target: 'sensor', label: 'Terugkoppeling (-)', style: { stroke: '#ef4444' }, animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    ];

    return (
        <div className="bg-obsidian-950/60 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-indigo-500/10 rounded-[1.5rem] border border-indigo-500/20 text-indigo-500">
                    <Activity size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                        Homeostase {config.system === 'glucose' ? 'Bloedsuiker' : 'Regelkring'}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Niveau O • Zelfregulatie</p>
                </div>
            </div>

            <div className="h-[400px] bg-black/20 rounded-[2rem] border border-white/5 relative overflow-hidden">
                <ReactFlow
                    nodes={initialNodes}
                    edges={initialEdges}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    style={{ background: 'transparent' }}
                >
                    <Background color="#1e293b" gap={20} />
                    <Controls className="bg-white/10 border-white/10 text-white" />
                </ReactFlow>
                {isNovice && (
                    <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 text-[10px] px-3 py-1 rounded-full border border-blue-500/30 backdrop-blur-md uppercase font-black tracking-widest">
                        Basic View
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 3. ECOLOGICAL DYNAMICA ENGINE (NIVEAU P) ---
export const PopulationEngine: React.FC<{
    config: ComponentConfig<"biology-ecology">;
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config, mastery }) => {
    const data = useMemo(() => {
        const points = [];
        const isPredator = config.type === 'food-web';
        for (let t = 0; t <= 100; t += 2) {
            points.push({
                time: t,
                prey: 50 + 20 * Math.sin(t * 0.1),
                predator: isPredator ? 30 + 15 * Math.sin(t * 0.1 - 1) : undefined
            });
        }
        return points;
    }, [config.type]);

    return (
        <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 backdrop-blur-2xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
                        <Network size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                            {config.type === 'food-web' ? 'Populatie-Dynamiek' : 'Ecosysteem-Model'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Niveau P • Populatie</p>
                    </div>
                </div>
            </div>

            <div className="w-full h-80 bg-black/20 rounded-2xl border border-white/5 p-6">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d35" opacity={0.1} />
                        <XAxis dataKey="time" stroke="#64748b" label={{ value: 'Tijd (generaties)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }} />
                        <YAxis stroke="#64748b" label={{ value: 'Aantal individuen', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Line type="monotone" dataKey="prey" name="Prooi" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive />
                        {config.type === 'food-web' && (
                            <Line type="monotone" dataKey="predator" name="Predator" stroke="#ef4444" strokeWidth={3} dot={false} isAnimationActive />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                {config.parameters && Object.entries(config.parameters).map(([k, v]) => (
                    <div key={k} className="p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-amber-500/50 transition-all">
                        <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-amber-500 transition-colors tracking-widest">{k}</span>
                        <div className="flex justify-between items-end mt-1">
                            <span className="text-lg font-black text-white">{v as React.ReactNode}</span>
                            {mastery === 'expert' && <InlineMath math="\frac{dN}{dt} = rN\frac{K-N}{K}" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 4. GENETICA & EVOLUTIE ENGINE (CROSS-LEVEL) ---
export const GeneticsEngine: React.FC<{
    config: ComponentConfig<"biology-genetics">;
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config, mastery }) => {
    return (
        <div className="bg-gradient-to-br from-obsidian-950 to-indigo-950/20 border border-white/10 rounded-[2.5rem] p-8 relative shadow-2xl overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12">
                <Share2 size={120} />
            </div>

            <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                    <LayoutGrid size={24} />
                </div>
                <div>
                    <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                        {config.mode === 'punnett' ? 'Kruisingsschema' : 'Stamboomonderzoek'}
                    </h4>
                    <span className="text-xs text-indigo-400/60 font-black uppercase tracking-widest mt-1 block">Genetica • Erfelijkheid & Evolutie</span>
                </div>
            </div>

            {config.mode === 'punnett' ? (
                <div className="flex flex-col items-center gap-8">
                    <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-sm">
                        <div />
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center font-black text-indigo-400">{config.traits[0]?.[0]}</div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center font-black text-indigo-400">{config.traits[0]?.[1]}</div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center font-black text-amber-400">{config.traits[1]?.[0]}</div>
                        <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/30 flex items-center justify-center font-black text-white">{config.traits[1]?.[0]}{config.traits[0]?.[0]}</div>
                        <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/30 flex items-center justify-center font-black text-white">{config.traits[1]?.[0]}{config.traits[0]?.[1]}</div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center font-black text-amber-400">{config.traits[1]?.[1]}</div>
                        <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/30 flex items-center justify-center font-black text-white">{config.traits[1]?.[1]}{config.traits[0]?.[0]}</div>
                        <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/30 flex items-center justify-center font-black text-white">{config.traits[1]?.[1]}{config.traits[0]?.[1]}</div>
                    </div>

                    <div className="flex gap-4 w-full">
                        <div className="flex-1 p-4 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
                            <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Fenotype Verhouding</span>
                            <span className="text-xl font-black text-white italic tracking-tighter">3 : 1</span>
                        </div>
                        {mastery !== 'novice' && (
                            <div className="flex-1 p-4 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
                                <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Hardy-Weinberg</span>
                                <span className="text-xl font-black text-electric"><InlineMath math="p^2 + 2pq + q^2 = 1" /></span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] bg-black/20">
                    <span className="text-slate-500 uppercase font-black tracking-widest animate-pulse italic">Pedigree Visualizer Loading...</span>
                </div>
            )}
        </div>
    );
};

// --- MAIN BIOLOGY ENGINE ROUTER ---
export const BiologyEngine: React.FC<{
    config: InteractiveComponent['config'];
    type: InteractiveComponent['type'];
    mastery?: 'novice' | 'competent' | 'expert';
    onUpdate?: (newConfig: InteractiveComponent['config']) => void;
}> = ({ type, config, mastery = 'novice' }) => {
    switch (type) {
        case "biology-process":
            return <CellProcessEngine config={config as ComponentConfig<"biology-process">} mastery={mastery} />;
        case "biology-feedback":
            return <PhysiologyEngine config={config as ComponentConfig<"biology-feedback">} mastery={mastery} />;
        case "biology-genetics":
            return <GeneticsEngine config={config as ComponentConfig<"biology-genetics">} mastery={mastery} />;
        case "biology-ecology":
            return <PopulationEngine config={config as ComponentConfig<"biology-ecology">} mastery={mastery} />;
        default:
            return <div className="p-10 border-2 border-dashed border-red-500/20 text-red-400 rounded-3xl text-center uppercase tracking-widest font-black">Unknown Biology Engine Type</div>;
    }
};
