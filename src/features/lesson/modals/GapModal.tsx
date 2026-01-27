import { useTranslations } from "@shared/hooks/useTranslations";
import { AlertTriangle } from "lucide-react";
import React from "react";

interface GapModalProps {
    isOpen: boolean;
    onClose: () => void;
    missingConcepts: string[];
    onConfirm: () => void;
}

export const GapModal: React.FC<GapModalProps> = ({
    isOpen,
    onClose,
    missingConcepts,
    onConfirm,
}) => {
    const { t } = useTranslations();
    const lessonT = (t as unknown as Record<string, Record<string, string>>).LessonGenerator || {};

    React.useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gap-modal-title"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-obsidian-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 focus-within:ring-2 ring-amber-500/20">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0" size={24} aria-hidden="true" />
                    <div className="flex-1">
                        <h2 id="gap-modal-title" className="text-lg font-bold text-white mb-2">
                            {lessonT.gaps_detected || "Mogelijke Hiaten"}
                        </h2>
                        <div id="gap-modal-desc">
                            <ul className="list-disc list-inside text-amber-200 text-sm mb-6 font-bold" aria-label={lessonT.missing_concepts || "Ontbrekende concepten"}>
                                {missingConcepts.map((c, i) => (
                                    <li key={i}>{c}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                {lessonT.upload_more || "Uploaden"}
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
                            >
                                {lessonT.generate_anyway || "Toch Genereren"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
