import { MCPToolState,useMcpToolStore } from "@shared/model/mcpToolStore";
import { AnimatePresence,motion } from "framer-motion";
import {
    ArrowLeft,
    Bot,
    ChevronRight,
    Clock,
    Code2,
    Eye,
    Languages,
    LayoutGrid,
    LayoutList,
    LucideIcon,
    Mic,
    Search,
    Terminal,
    Wrench,
    Zap,
} from "lucide-react";
import React, { useEffect,useState } from "react";

import { EliteCard } from "../../components/EliteCard";
import { ToolEditorModal } from "../../components/ToolEditorModal";

export const ToolRegistry: React.FC = () => {
    const { tools, fetchTools, toggleTool, isLoading: toolsLoading } = useMcpToolStore();
    const [editingTool, setEditingTool] = useState<Partial<MCPToolState> | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"tiles" | "all">("tiles");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchTools();
    }, [fetchTools]);

    const CATEGORIES: {
        id: string;
        label: string;
        icon: LucideIcon;
        color: string;
        count: number;
        desc: string;
    }[] = [
            {
                id: "Education",
                label: "Education",
                icon: Bot,
                color: "orange",
                count: tools.filter((t) => t.category === "Education").length,
                desc: "Tools for learning, quizzes & study plans",
            },
            {
                id: "Math",
                label: "Math & Logic",
                icon: Terminal,
                color: "blue",
                count: tools.filter((t) => t.category === "Math").length,
                desc: "Symbolic math, solvers & calculators",
            },
            {
                id: "Science",
                label: "Science",
                icon: Zap,
                color: "emerald",
                count: tools.filter((t) => t.category === "Science").length,
                desc: "Physics, Chem & Bio simulations",
            },
            {
                id: "Language",
                label: "Language",
                icon: Languages,
                color: "purple",
                count: tools.filter((t) => t.category === "Language").length,
                desc: "Translation, parsing & grammar",
            },
            {
                id: "Research",
                label: "Research",
                icon: Eye,
                color: "cyan",
                count: tools.filter((t) => t.category === "Research").length,
                desc: "Data gathering, audit & citations",
            },
            {
                id: "Planning",
                label: "Planning",
                icon: Clock,
                color: "indigo",
                count: tools.filter((t) => t.category === "Planning").length,
                desc: "Scheduling, PWS & task management",
            },
            {
                id: "Media",
                label: "Media",
                icon: Mic,
                color: "rose",
                count: tools.filter((t) => t.category === "Media").length,
                desc: "Audio, video & image processing",
            },
            {
                id: "General",
                label: "General",
                icon: Wrench,
                color: "zinc",
                count: tools.filter((t) => t.category === "General" || !t.category).length,
                desc: "Utility tools and system handlers",
            },
        ];

    const filteredTools = tools.filter((t) => {
        const matchesCategory =
            !selectedCategory ||
            (selectedCategory === "General"
                ? t.category === "General" || !t.category
                : t.category === selectedCategory);

        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <Wrench className="text-orange-500" />
                        Tool Registry
                    </h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mt-1">
                        {selectedCategory
                            ? `Browsing ${selectedCategory}`
                            : viewMode === "all"
                                ? "All Systems Operational"
                                : "Category Navigation"}{" "}
            // REGISTRY V1.0
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            size={14}
                        />
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-950 border border-white/5 rounded-full py-2 pl-9 pr-4 text-xs text-white focus:border-orange-500/50 outline-none w-64"
                        />
                    </div>

                    <button
                        onClick={() => {
                            setSelectedCategory(null);
                            setViewMode(viewMode === "all" ? "tiles" : "all");
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${viewMode === "all"
                            ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                            }`}
                    >
                        {viewMode === "all" ? (
                            <LayoutGrid size={14} />
                        ) : (
                            <LayoutList size={14} />
                        )}
                        {viewMode === "all" ? "Show Tiles" : "Show All"}
                    </button>

                    <button
                        onClick={() => {
                            setEditingTool(null);
                            setIsEditorOpen(true);
                        }}
                        className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:bg-orange-500/20"
                    >
                        <Zap size={14} /> Add Tool
                    </button>
                </div>
            </div>

            {selectedCategory && (
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors mb-4 group"
                >
                    <ArrowLeft
                        size={14}
                        className="group-hover:-translate-x-1 transition-transform"
                    />
                    Back to Selection
                </button>
            )}

            {toolsLoading ? (
                <div className="h-64 flex items-center justify-center text-slate-500 italic">
                    Accessing registry...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence mode="popLayout">
                        {!selectedCategory && viewMode === "tiles"
                            ? CATEGORIES.map((cat, i) => (
                                <motion.div
                                    key={cat.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`
                      group relative p-6 rounded-3xl border border-white/5 bg-zinc-950/50 hover:bg-zinc-950 
                      cursor-pointer transition-all duration-500 hover:border-${cat.color}-500/30
                      flex flex-col h-48 justify-between overflow-hidden
                    `}
                                >
                                    <div
                                        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-${cat.color}-500/5 blur-3xl group-hover:bg-${cat.color}-500/10 transition-colors`}
                                    />

                                    <div className="flex justify-between items-start relative z-10">
                                        <div
                                            className={`p-3 rounded-2xl bg-${cat.color}-500/10 text-${cat.color}-400 group-hover:scale-110 transition-transform duration-500`}
                                        >
                                            <cat.icon size={24} />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-white group-hover:text-${cat.color}-400 transition-colors">
                                                {cat.count}
                                            </div>
                                            <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">
                                                Tools
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <h4 className="text-lg font-black text-white group-hover:translate-x-1 transition-transform">
                                            {cat.label}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-medium">
                                            {cat.desc}
                                        </p>
                                    </div>

                                    <div
                                        className={`absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300 text-${cat.color}-400`}
                                    >
                                        <ChevronRight size={18} />
                                    </div>
                                </motion.div>
                            ))
                            : filteredTools.map((tool) => (
                                <motion.div
                                    key={tool.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <EliteCard
                                        glowColor={
                                            tool.enabled
                                                ? CATEGORIES.find((c) => c.id === tool.category)?.color || "orange"
                                                : "zinc"
                                        }
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div
                                                className={`p-2 rounded-lg ${tool.enabled ? "bg-orange-500/10 text-orange-400" : "bg-zinc-500/10 text-zinc-500"}`}
                                            >
                                                {React.createElement(
                                                    CATEGORIES.find((c) => c.id === tool.category)?.icon || Bot,
                                                    { size: 18 }
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter">
                                                    Calls: {tool.usageCount}
                                                </span>
                                                <button
                                                    onClick={() => toggleTool(tool.id, !tool.enabled)}
                                                    className={`
                            w-10 h-5 rounded-full relative transition-all duration-300
                            ${tool.enabled ? "bg-orange-500/40" : "bg-zinc-800"}
                          `}
                                                >
                                                    <div
                                                        className={`
                              absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300
                              ${tool.enabled ? "left-6" : "left-1"}
                            `}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                        <h4
                                            className={`font-bold text-sm mb-1 ${tool.enabled ? "text-white" : "text-slate-500"}`}
                                        >
                                            {tool.name.replace(/_/g, " ")}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 line-clamp-2 h-8 leading-relaxed mb-3">
                                            {tool.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`text-[9px] px-1.5 py-0.5 rounded border ${tool.enabled
                                                    ? "bg-orange-500/5 border-orange-500/20 text-orange-500/70"
                                                    : "bg-white/5 border-white/5 text-slate-700"
                                                    } uppercase font-bold tracking-widest`}
                                            >
                                                {tool.category || "General"}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setEditingTool(tool);
                                                    setIsEditorOpen(true);
                                                }}
                                                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-orange-400 transition-colors bg-white/5 hover:bg-orange-500/10 px-2 py-1 rounded"
                                            >
                                                <Code2 size={12} /> Edit Code
                                            </button>
                                        </div>
                                    </EliteCard>
                                </motion.div>
                            ))}
                    </AnimatePresence>
                </div>
            )}

            <ToolEditorModal
                isOpen={isEditorOpen}
                tool={editingTool}
                onClose={() => setIsEditorOpen(false)}
            />
        </div>
    );
};
