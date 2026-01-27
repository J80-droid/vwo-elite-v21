import { useTranslations } from "@shared/hooks/useTranslations";
import { Sparkles,X } from "lucide-react";
import React from "react";

import { ModalType } from "../../hooks/useSubjectRoomState";

interface AddContentModalProps {
    type: ModalType;
    title: string;
    value: string;
    theme: { bg: string; text: string };
    onClose: () => void;
    onTitleChange: (val: string) => void;
    onValueChange: (val: string) => void;
    onSubmit: () => void;
}

export const AddContentModal: React.FC<AddContentModalProps> = ({
    type,
    title,
    value,
    theme,
    onClose,
    onTitleChange,
    onValueChange,
    onSubmit,
}) => {
    const { t } = useTranslations();

    if (!type || type === "saveSet" || type === "loadSet") return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#050914] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-3xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                            {t("library.modals.labels.title")}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                            placeholder={t("library.modals.placeholders.title")}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                            {type === "text"
                                ? t("library.modals.labels.content")
                                : t("library.modals.labels.url")}
                        </label>
                        {type === "text" ? (
                            <textarea
                                rows={5}
                                value={value}
                                onChange={(e) => onValueChange(e.target.value)}
                                placeholder="Typ of plak hier je informatie..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                            />
                        ) : (
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => onValueChange(e.target.value)}
                                placeholder={
                                    type === "search"
                                        ? t("library.modals.placeholders.search")
                                        : t("library.modals.placeholders.url")
                                }
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        )}
                    </div>
                </div>
                <button
                    onClick={onSubmit}
                    className={`w-full mt-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all
            ${value.trim() ? `${theme.bg} ${theme.text}` : "bg-white/5 text-slate-500 cursor-not-allowed"}
          `}
                >
                    <Sparkles size={14} /> {t("library.modals.add_btn")}
                </button>
            </div>
        </div>
    );
};
