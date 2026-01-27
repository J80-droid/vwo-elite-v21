import { useProteinExplorer } from "@features/biology/hooks/useProteinExplorer";
import { cn } from "@shared/lib/utils";
import { MeshViewer } from "@shared/ui/components/MeshViewer";
import { ChevronRight, Loader2, Search } from "lucide-react";
import React, { useState } from "react";

export const ProteinSidebar: React.FC = () => {
    const { state, handleSearch, handleSelect } = useProteinExplorer();
    const [localQuery, setLocalQuery] = useState(state.query);

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-white/30 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                    type="text"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch(localQuery)}
                    placeholder="Zoek eiwit of UniProt ID..."
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm placeholder:text-white/20"
                />
                <button
                    onClick={() => handleSearch(localQuery)}
                    disabled={state.loading}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all disabled:opacity-50"
                >
                    {state.loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Error */}
            {state.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs animate-in fade-in slide-in-from-top-1">
                    {state.error}
                </div>
            )}

            {/* Results */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {state.query ? "Zoekresultaten" : "Vaak Bekeken"}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{state.results.length}</span>
                </div>

                {state.results.map((protein) => (
                    <button
                        key={protein.uniprotId}
                        onClick={() => handleSelect(protein)}
                        className={cn(
                            "w-full p-3 rounded-xl text-left transition-all border group",
                            state.selectedProtein?.uniprotId === protein.uniprotId
                                ? "bg-purple-500/20 border-purple-500/50 shadow-lg"
                                : "bg-white/5 border-white/5 hover:border-white/10"
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-white text-xs group-hover:text-purple-300 transition-colors truncate">
                                    {protein.proteinName}
                                </div>
                                <div className="text-[10px] text-white/40 font-mono mt-0.5">
                                    {protein.uniprotId}
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-black/40 rounded-lg border border-white/5 overflow-hidden opacity-40 group-hover:opacity-100 transition-opacity">
                                <MeshViewer
                                    url={protein.pdbUrl || ""}
                                    autoRotate
                                    shadows={false}
                                />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
