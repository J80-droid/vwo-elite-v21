import { FileText, X } from "lucide-react";
import React from "react";

import { StudyMaterial } from "../../../../shared/types/study";

interface MaterialListProps {
    materials: StudyMaterial[];
    themeText: string;
    onDelete: (id: string) => void;
    label: string;
    activeCountLabel: string;
}

export const MaterialList: React.FC<MaterialListProps> = ({
    materials,
    themeText,
    onDelete,
    label,
    activeCountLabel,
}) => {
    if (materials.length === 0) return null;

    return (
        <div className="mt-6">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex justify-between">
                <span>{label}</span>
                <span className={themeText}>
                    {materials.length} {activeCountLabel}
                </span>
            </label>
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 w-full">
                {materials.map((f) => (
                    <div
                        key={f.id}
                        className="flex items-center gap-2 text-[10px] bg-white/5 px-3 py-2 rounded-xl text-slate-300 border border-white/5 whitespace-nowrap shrink-0 group/item relative pr-8 animate-in fade-in slide-in-from-bottom-2"
                    >
                        <FileText size={12} className="text-blue-400" />
                        <span className="max-w-[120px] truncate font-bold">
                            {f.name}
                        </span>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(f.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all z-20"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
