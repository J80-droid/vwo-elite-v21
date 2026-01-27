import { useProteinExplorer } from "@features/biology/hooks/useProteinExplorer";
import { getConfidenceColor, getConfidenceDescription } from "@shared/api/alphafoldService";
import { AlertTriangle } from "lucide-react";
import React from "react";

export const ProteinAnalysis: React.FC = () => {
    const { state } = useProteinExplorer();
    const { selectedProtein } = state;

    if (!selectedProtein) return null;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[8px] text-white/40 uppercase font-bold tracking-widest mb-1">
                        Lengte
                    </div>
                    <div className="text-sm font-bold text-white">
                        {selectedProtein.sequenceLength}{" "}
                        <span className="text-[10px] text-white/40 font-normal">aa</span>
                    </div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[8px] text-white/40 uppercase font-bold tracking-widest mb-1">
                        Betrouwbaarheid
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: getConfidenceColor(selectedProtein.confidenceLevel) }}
                        />
                        <div className="text-sm font-bold text-white">
                            {selectedProtein.averageConfidence.toFixed(1)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] text-white/40 uppercase font-bold tracking-widest mb-1">
                    Omschrijving
                </div>
                <div className="text-[10px] text-white/70 leading-relaxed">
                    {getConfidenceDescription(selectedProtein.confidenceLevel)}
                </div>
            </div>

            {/* PAE Preview */}
            {selectedProtein.paeImageUrl && (
                <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/20 space-y-3">
                    <h4 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-purple-300">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        PAE Matrix
                    </h4>
                    <div className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/20">
                        <img
                            src={selectedProtein.paeImageUrl}
                            alt="PAE Matrix"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <p className="text-[8px] text-white/30 leading-tight">
                        De PAE-matrix laat de onzekerheid zien in de relatieve posities van aminozuren.
                    </p>
                </div>
            )}
        </div>
    );
};
