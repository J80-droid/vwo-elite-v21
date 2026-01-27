import { useProteinExplorer } from "@features/biology/hooks/useProteinExplorer";
import { getAlphaFoldViewerUrl } from "@shared/api/alphafoldService";
import { Atom, Download, ExternalLink } from "lucide-react";
import React from "react";

export const ProteinParameters: React.FC = () => {
    const { state } = useProteinExplorer();
    const { selectedProtein } = state;

    if (!selectedProtein) {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                        Selecteer een eiwit om de parameters te bekijken
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Legend */}
            <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Confidence Legend
                </span>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-[#0053d6]" />
                        <span className="text-[10px] text-white/60">Zeer Hoog</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-[#65cbf3]" />
                        <span className="text-[10px] text-white/60">Hoog</span>
                    </div>
                </div>
            </div>

            {/* Detail Identity */}
            <div className="p-4 bg-obsidian-900/60 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-xl">
                        <Atom size={18} className="text-purple-400" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                            {selectedProtein.entryName}
                        </div>
                        <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                            v{selectedProtein.latestVersion}
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] text-white/40 italic truncate">
                        {selectedProtein.organism}
                    </p>
                    {selectedProtein.geneName && (
                        <p className="text-[10px] font-bold text-pink-400/80">
                            Gene: {selectedProtein.geneName}
                        </p>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    <a
                        href={getAlphaFoldViewerUrl(selectedProtein.uniprotId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg border border-white/5 text-[10px] font-bold tracking-widest uppercase"
                    >
                        <ExternalLink size={12} />
                        DB
                    </a>
                    <a
                        href={selectedProtein.pdbUrl}
                        download
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/20 text-[10px] font-bold tracking-widest uppercase"
                    >
                        <Download size={12} />
                        PDB
                    </a>
                </div>
            </div>
        </div>
    );
};
