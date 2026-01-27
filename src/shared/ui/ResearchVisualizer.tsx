import { cn } from "@shared/lib/utils";
import {
    BarChart3,
    BookOpen,
    Database,
    ExternalLink,
    Link,
    Search,
    ShieldCheck,
} from "lucide-react";
import React from "react";

import { MermaidChart } from "./MermaidChart";

export interface ResearchSource {
    title: string;
    url: string;
    snippet: string;
    type: string;
    relevance?: number;
}

export interface ResearchVisualizerProps {
    query: string;
    sources: ResearchSource[];
    extractedData?: string;
    visualizations?: Array<{
        type: string;
        library: string;
        code: string;
        caption: string;
    }>;
    className?: string;
}

export const ResearchVisualizer: React.FC<ResearchVisualizerProps> = ({
    query,
    sources,
    extractedData,
    visualizations,
    className
}) => {
    return (
        <div className={cn("flex flex-col gap-6 p-4 bg-obsidian-900/50 border border-white/10 rounded-2xl backdrop-blur-xl animate-in fade-in duration-500", className)}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Search className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">Research Findings</h3>
                        <p className="text-[10px] text-emerald-400/60 font-mono italic truncate max-w-[250px]">
                            Query: {query}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        {sources.length} Sources
                    </div>
                    {extractedData && (
                        <div className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                            Data Extracted
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Sources */}
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                        <BookOpen size={12} /> Academic Bibliography
                    </h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {sources.map((source, idx) => (
                            <div key={idx} className="group relative p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl transition-all">
                                <div className="flex justify-between items-start mb-1">
                                    <h5 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-1">
                                        {source.title}
                                    </h5>
                                    {source.relevance && (
                                        <span className="text-[9px] font-mono text-emerald-500/60">
                                            {Math.round(source.relevance * 100)}%
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 italic mb-2 line-clamp-2">
                                    {source.snippet}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-slate-600 flex items-center gap-1">
                                        <Database size={8} /> {source.type}
                                    </span>
                                    <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[9px] text-emerald-500 hover:text-emerald-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        View Source <ExternalLink size={8} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column 2: Data & Visuals */}
                <div className="space-y-6">
                    {/* Data Panel */}
                    {extractedData && (
                        <div>
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                <ShieldCheck size={12} /> Evidence & Extraction
                            </h4>
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Database size={40} className="text-emerald-500" />
                                </div>
                                <div className="text-[11px] text-emerald-100 font-mono whitespace-pre-wrap leading-relaxed relative z-10">
                                    {extractedData}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visualizations */}
                    {visualizations && visualizations.length > 0 && (
                        <div>
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                <BarChart3 size={12} /> Visual Logic
                            </h4>
                            <div className="space-y-4">
                                {visualizations.map((viz, idx) => (
                                    <div key={idx} className="space-y-2">
                                        {viz.library === 'mermaid' ? (
                                            <MermaidChart chart={viz.code} className="!my-0 border-white/5" />
                                        ) : (
                                            <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-[10px] text-slate-400 font-mono">
                                                {viz.code}
                                            </div>
                                        )}
                                        <p className="text-[9px] text-center text-slate-500 italic px-4">
                                            {viz.caption}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Matrix Footer */}
            <div className="flex items-center gap-4 mt-2 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Grounding Engine Active</span>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className="flex items-center gap-2">
                    <Link className="w-3 h-3 text-slate-600" />
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic flex items-center gap-1">
                        Verified by Scientific Researcher Persona
                    </span>
                </div>
            </div>
        </div>
    );
};
