import { useTranslations } from "@shared/hooks/useTranslations";
import { AlertTriangle } from "lucide-react";
import React from "react";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    desc?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    desc,
}) => {
    const { t } = useTranslations();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#050914] border border-rose-500/30 rounded-3xl p-8 max-w-sm w-full shadow-3xl text-center">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-white uppercase mb-2">
                    {title || t("library.modals.delete_title")}
                </h3>
                <p className="text-slate-400 text-sm mb-8">
                    {desc || t("library.modals.delete_desc")}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl font-bold transition-colors"
                    >
                        {t("library.modals.cancel")}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors"
                    >
                        {t("library.modals.delete")}
                    </button>
                </div>
            </div>
        </div>
    );
};
