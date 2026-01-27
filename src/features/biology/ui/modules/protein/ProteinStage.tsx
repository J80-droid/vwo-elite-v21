import { useProteinExplorer } from "@features/biology/hooks/useProteinExplorer";
import { getMolStarViewerUrl } from "@shared/api/alphafoldService";
import { AnimatePresence, motion } from "framer-motion";
import { Atom, Info } from "lucide-react";
import React from "react";

export const ProteinStage: React.FC = () => {
    const { state } = useProteinExplorer();
    const { selectedProtein } = state;

    return (
        <div className="h-full w-full flex flex-col relative overflow-hidden">
            <AnimatePresence mode="wait">
                {selectedProtein ? (
                    <motion.div
                        key="viewer"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="flex-1 relative"
                    >
                        <div className="absolute inset-0 bg-black/40 group/viewer shadow-2xl">
                            <iframe
                                src={getMolStarViewerUrl(selectedProtein.uniprotId)}
                                className="w-full h-full border-0"
                                title="Protein 3D Structure"
                                loading="lazy"
                            />
                            {/* Overlay info */}
                            <div className="absolute top-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover/viewer:opacity-100 transition-opacity pointer-events-none">
                                <div className="text-[10px] font-bold text-white/80 uppercase">
                                    Structure: {selectedProtein.uniprotId}
                                </div>
                            </div>

                            <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-black/40 backdrop-blur px-2 py-1 rounded-md border border-blue-500/20">
                                    Interactive 3D Layer
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-center text-center p-12"
                    >
                        <div className="p-6 bg-purple-500/10 rounded-full mb-6 relative">
                            <div className="w-12 h-12 text-purple-400/50 flex items-center justify-center">
                                <Atom size={48} />
                            </div>
                            <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
                        </div>
                        <h3 className="text-xl font-bold text-white/60 mb-2">
                            Geen Eiwit Geselecteerd
                        </h3>
                        <p className="text-sm text-white/30 max-w-xs leading-relaxed">
                            Kies een eiwit uit de lijst of gebruik de zoekbalk om een
                            specifieke structuur te verkennen.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-6 left-6 flex items-center gap-2 text-xs text-white/40 bg-black/40 backdrop-blur px-3 py-1.5 rounded-full border border-white/5 pointer-events-none">
                <Info className="w-3 h-3" />
                <span>Gebruik muis om te draaien en zoomen</span>
            </div>
        </div>
    );
};


