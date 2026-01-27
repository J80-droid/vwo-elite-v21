import { useContextSetStore } from "@shared/model/contextSetStore";
import { FolderOpen, X } from "lucide-react";
import React from "react";

import { StudyMaterial } from "../../../../shared/types/study";

interface LoadSetModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjectName: string;
    materials: StudyMaterial[];
    selectedMaterials: Set<string>;
    toggleSelection: (id: string) => void;
}

export const LoadSetModal: React.FC<LoadSetModalProps> = ({
    isOpen,
    onClose,
    subjectName,
    materials,
    selectedMaterials,
    toggleSelection,
}) => {
    const { getSetsBySubject } = useContextSetStore();
    const sets = getSetsBySubject(subjectName);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 flex items-center justify-center p-6">
            <div className="bg-[#050914] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-3xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <FolderOpen size={20} className="text-blue-500" />
                        Kies Context Set
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {sets.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-500 text-sm">Geen opgeslagen sets gevonden.</p>
                            <p className="text-xs text-slate-600 mt-1">Sla een selectie op via de 'Save' knop.</p>
                        </div>
                    ) : (
                        sets.map((set) => (
                            <button
                                key={set.id}
                                onClick={() => {
                                    set.materialIds.forEach((id: string) => {
                                        // Check of materiaal nog bestaat en nog niet geselecteerd is
                                        if (materials.find((m) => m.id === id) && !selectedMaterials.has(id)) {
                                            toggleSelection(id);
                                        }
                                    });
                                    onClose();
                                }}
                                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 rounded-xl text-left transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-white group-hover:text-blue-400">
                                        {set.name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 bg-black/30 px-2 py-1 rounded-full">
                                        {set.materialIds.length} bronnen
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
