import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import {
    Activity,
    Atom,
    FlaskConical,
    LayoutGrid,
    RotateCcw,
    Zap
} from "lucide-react";
import * as NGL from "ngl";
import React, { useEffect, useRef, useState } from "react";
import { InlineMath } from "react-katex";
import {
    Area,
    AreaChart,
    CartesianGrid,
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

// --- 1. MOLECULE & STRUCTUUR ENGINE ---
export const MoleculeViewer: React.FC<{
    config: ComponentConfig<"chemistry-molecule">;
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config, mastery }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<NGL.Stage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!containerRef.current) return;

        const stage = new NGL.Stage(containerRef.current, {
            backgroundColor: "transparent",
            quality: "high"
        });
        stageRef.current = stage;

        const loadMolecule = async () => {
            try {
                // Determine if it's PDB or SMILES (simple check)
                const isSMILES = config.moleculeData.length < 50 && !config.moleculeData.includes("\n");
                if (isSMILES) {
                    // SMILES requires conversion or direct NGL support check
                    // For now, assume config.moleculeData is ready for stage.loadFile
                    await stage.loadFile(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${config.moleculeData}/SDF?record_type=3d`, { ext: "sdf" })
                        .then(comp => {
                            if (comp) comp.addRepresentation("ball+stick", { colorScheme: "element" });
                            stage.autoView();
                        });
                } else {
                    await stage.loadFile(`rcsb://${config.moleculeData}`)
                        .then(comp => {
                            if (comp) {
                                comp.addRepresentation("cartoon", { colorScheme: "chainid" });
                                if (mastery !== 'novice') {
                                    comp.addRepresentation("licorice", { colorScheme: "element", sele: "not polymer" });
                                }
                            }
                            stage.autoView();
                        });
                }
                setLoading(false);
            } catch (err) {
                console.error("NGL Load Error:", err);
                setLoading(false);
            }
        };

        loadMolecule();

        const handleResize = () => stage.handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            stage.dispose();
            window.removeEventListener("resize", handleResize);
        };
    }, [config.moleculeData, mastery]);

    return (
        <div className="relative w-full aspect-video bg-obsidian-900 rounded-[2rem] border border-white/10 overflow-hidden group shadow-2xl">
            <div ref={containerRef} className="w-full h-full cursor-move" />

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-obsidian-950/50 backdrop-blur-md">
                    <Atom className="animate-spin text-electric" size={48} />
                </div>
            )}

            {/* Elite UI Overlay */}
            <div className="absolute top-6 left-6 pointer-events-none">
                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl backdrop-blur-xl border border-white/10">
                    <div className="p-2 bg-electric/20 rounded-xl text-electric">
                        {config.type === 'vsepr' ? <LayoutGrid size={18} /> : <Atom size={18} />}
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">
                            {config.type === 'vsepr' ? 'VSEPR Ruimtelijke Bouw' : config.type === 'protein' ? 'Eiwit-Structuur' : 'Kristalrooster'}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">Syllabus 2025 • B1/G1</span>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 flex gap-2">
                <button
                    onClick={() => stageRef.current?.autoView()}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 pointer-events-auto"
                >
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );
};

// --- 2. LAB & ANALYSE ENGINE ---
export const LabAnalyzer: React.FC<{
    config: ComponentConfig<"chemistry-analysis">;
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config, mastery }) => {
    const isSpectral = ["mass-spec", "ir-spec"].includes(config.instrument);

    return (
        <div className="flex flex-col gap-4 bg-obsidian-950/40 border border-white/5 rounded-3xl p-6 backdrop-blur-2xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                            {config.instrument === 'mass-spec' ? 'Massaspectrometrie' :
                                config.instrument === 'titration' ? 'Titratie-Curve' :
                                    config.instrument === 'energy' ? 'Energiediagram' : 'Analytische Chemie'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Instrumentele Analyse • Syllabus 2025</p>
                    </div>
                </div>
            </div>

            <div className="w-full h-64 bg-black/20 rounded-2xl border border-white/5 p-4">
                <ResponsiveContainer width="100%" height="100%">
                    {config.instrument === 'titration' ? (
                        <LineChart data={config.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d35" />
                            <XAxis dataKey="volume" label={{ value: 'mL Base', position: 'insideBottomRight', offset: -5, fill: '#64748b' }} stroke="#64748b" />
                            <YAxis domain={[0, 14]} label={{ value: 'pH', angle: -90, position: 'insideLeft', fill: '#64748b' }} stroke="#64748b" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                itemStyle={{ color: '#fbbf24' }}
                            />
                            <Line type="monotone" dataKey="ph" stroke="#fbbf24" strokeWidth={3} dot={mastery === 'expert'} />
                        </LineChart>
                    ) : isSpectral ? (
                        <AreaChart data={config.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d35" />
                            <XAxis dataKey="index" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                            />
                            <Area type="step" dataKey="intensity" stroke="#6366f1" fill="#6366f133" />
                        </AreaChart>
                    ) : (
                        <LineChart data={config.data}>
                            <Line type="basis" dataKey="energy" stroke="#ef4444" strokeWidth={3} dot={false} />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Analysis Data Table / Highlights */}
            {mastery !== 'novice' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                    {config.instrument === 'titration' && (
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Equivalentiepunt</span>
                            <span className="text-sm font-bold text-white">pH ≈ 8.7</span>
                        </div>
                    )}
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Domein</span>
                        <span className="text-sm font-bold text-white">C2/D1</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 3. PROCES & MECHANISME ENGINE ---
// Simplistic Mock for now, usage of React Flow recommended for actual implementation
export const ProcessEngine: React.FC<{
    config: ComponentConfig<"chemistry-process">;
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config }) => {
    return (
        <div className="bg-obsidian-950/60 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-emerald-500/10 rounded-[1.5rem] border border-emerald-500/20 text-emerald-500">
                    <FlaskConical size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                        {config.type === 'mechanism' ? 'Reactiemechanisme' : config.type === 'industrial' ? 'Blokschema' : 'Verschuiving Evenwicht'}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Elite Dynamic Simulator</p>
                </div>
            </div>

            <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] bg-black/20">
                <div className="text-center">
                    <Activity className="text-emerald-500 mx-auto mb-4 animate-pulse" size={32} />
                    <p className="text-slate-400 font-mono text-sm">Interactive Mechanism Engine Active</p>
                    <div className="mt-4 flex gap-4">
                        <InlineMath math="A + B \rightleftharpoons C + D" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 4. ELEKTROCHEMIE ENGINE ---
export const ElectroEngine: React.FC<{
    config: ComponentConfig<"chemistry-electro">;
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config }) => {
    return (
        <div className="bg-gradient-to-br from-obsidian-900 to-indigo-950/30 border border-white/10 rounded-[2.5rem] p-8 relative shadow-2xl">
            <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                            {config.type === 'galvanic' ? 'Galvanische Cel' : 'Elektrolyse Opstelling'}
                        </h4>
                        <span className="text-xs text-indigo-400/60 font-black uppercase tracking-widest mt-1 block">Redox-Dynamica • C1/F3</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
                {/* Schematic Anode Side */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Anode (-)</span>
                        <span className="text-sm font-bold text-white">{config.anode}</span>
                    </div>
                    <div className="h-32 bg-white/5 rounded-2xl border-l-4 border-indigo-500 relative flex items-center justify-center">
                        <div className="text-indigo-400 absolute top-2 right-4"><Activity size={16} /></div>
                        <InlineMath math={`${config.anode} \to ${config.anode}^{2+} + 2e^-`} />
                    </div>
                </div>

                {/* Schematic Cathode Side */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kathode (+)</span>
                        <span className="text-sm font-bold text-white">{config.cathode}</span>
                    </div>
                    <div className="h-32 bg-white/5 rounded-2xl border-r-4 border-amber-500 relative flex items-center justify-center">
                        <div className="text-amber-400 absolute top-2 left-4"><Activity size={16} /></div>
                        <InlineMath math={`${config.cathode}^{2+} + 2e^- \to ${config.cathode}`} />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Berekende Spanning</span>
                    <span className="text-xl font-black text-electric">{config.voltage || 1.10} V</span>
                </div>
            </div>
        </div>
    );
};

// --- MAIN CHEMISTRY ENGINE ROUTER ---
export const ChemistryEngine: React.FC<{
    config: InteractiveComponent['config'];
    type: InteractiveComponent['type'];
    mastery?: 'novice' | 'competent' | 'expert';
    onUpdate?: (newConfig: InteractiveComponent['config']) => void;
}> = ({ type, config, mastery = 'novice' }) => {
    switch (type) {
        case "chemistry-molecule":
            return <MoleculeViewer config={config as ComponentConfig<"chemistry-molecule">} mastery={mastery} />;
        case "chemistry-analysis":
            return <LabAnalyzer config={config as ComponentConfig<"chemistry-analysis">} mastery={mastery} />;
        case "chemistry-process":
            return <ProcessEngine config={config as ComponentConfig<"chemistry-process">} mastery={mastery} />;
        case "chemistry-electro":
            return <ElectroEngine config={config as ComponentConfig<"chemistry-electro">} mastery={mastery} />;
        default:
            return <div className="p-10 border-2 border-dashed border-red-500/20 text-red-400 rounded-3xl text-center uppercase tracking-widest font-black">Unknown Chemistry Engine Type</div>;
    }
};
