import { useTranslations } from "@shared/hooks/useTranslations";
import {
    Brain, CheckCircle2, Cpu, Layers, Loader2, Mic, PenTool, Scale, Sparkles, Target, X
} from "lucide-react";
import React from "react";

import { StudyMaterial } from "../../../../shared/types/study";
import { ContextDock } from "../ContextDock";
import { MaterialList } from "./MaterialList";

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: { bg: string; text: string; border: string; shadow: string };
    materials: StudyMaterial[];
    onDeleteMaterial: (id: string) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDockAction: (action: string) => void;
    modes: Set<string>;
    onToggleMode: (id: string) => void;
    topic: string;
    onTopicChange: (val: string) => void;
    loading: boolean;
    progress: number;
    progressStatus: string | null;
    canStart: boolean;
    onSubmit: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
    isOpen,
    onClose,
    theme,
    materials,
    onDeleteMaterial,
    onFileUpload,
    onDockAction,
    modes,
    onToggleMode,
    topic,
    onTopicChange,
    loading,
    progress,
    progressStatus,
    canStart,
    onSubmit,
}) => {
    const { t } = useTranslations();

    if (!isOpen) return null;

    const modeOptions = [
        { id: "recap", icon: Layers, label: t("library.modes.recap.label"), desc: t("library.modes.recap.desc"), color: "text-blue-400" },
        { id: "deep", icon: Brain, label: t("library.modes.deep.label"), desc: t("library.modes.deep.desc"), color: "text-purple-400" },
        { id: "exam", icon: Target, label: t("library.modes.exam.label"), desc: t("library.modes.exam.desc"), color: "text-emerald-400" },
        { id: "analysis", icon: Scale, label: t("library.modes.analysis.label"), desc: t("library.modes.analysis.desc"), color: "text-amber-400" },
        { id: "argument", icon: PenTool, label: t("library.modes.argument.label"), desc: t("library.modes.argument.desc"), color: "text-rose-400" },
        { id: "oral", icon: Mic, label: t("library.modes.oral.label"), desc: t("library.modes.oral.desc"), color: "text-cyan-400" },
    ];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#050914] border border-white/10 rounded-[32px] p-6 md:p-10 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-3xl animate-in zoom-in-95 duration-300 relative">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all z-20"
                >
                    <X size={24} />
                </button>

                <div className="relative flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className={`w-12 h-12 rounded-2xl ${theme.bg} flex items-center justify-center shadow-lg`}>
                            <Cpu size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                {t("library.config.title")}
                            </h2>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                {t("library.config.subtitle")}
                            </p>
                        </div>
                    </div>

                    <div className="mb-8 relative z-10">
                        <input
                            type="file"
                            multiple
                            id="hidden-file-upload"
                            className="hidden"
                            onChange={onFileUpload}
                        />
                        <ContextDock onAction={onDockAction} />
                        <MaterialList
                            materials={materials}
                            themeText={theme.text}
                            onDelete={onDeleteMaterial}
                            label={t("library.config.selected_context")}
                            activeCountLabel={t("library.config.active_count")}
                        />
                    </div>

                    <div className="space-y-10">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block underline decoration-blue-500/30 underline-offset-4">
                                {t("library.config.step_1")}
                            </label>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {modeOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => onToggleMode(opt.id)}
                                        className={`p-5 rounded-2xl border text-left transition-all group relative overflow-hidden ${modes.has(opt.id)
                                            ? `border-${opt.color.split("-")[1]}-500 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]`
                                            : "border-white/5 bg-white/[0.02] hover:bg-white/5 opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <opt.icon
                                                size={24}
                                                className={modes.has(opt.id) ? opt.color : "text-slate-500 group-hover:text-slate-300 transition-colors"}
                                            />
                                            {modes.has(opt.id) && (
                                                <div className={`w-2 h-2 rounded-full bg-${opt.color.split("-")[1]}-500 shadow-[0_0_8px_currentColor]`} />
                                            )}
                                        </div>
                                        <div className="font-black text-sm text-white mb-1 uppercase tracking-tight">
                                            {opt.label}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold leading-tight group-hover:text-slate-400">
                                            {opt.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block underline decoration-blue-500/30 underline-offset-4">
                                {t("library.config.step_2")}
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => onTopicChange(e.target.value)}
                                placeholder={t("library.config.topic_placeholder")}
                                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all font-bold"
                            />
                        </div>

                        <div className="pt-4 relative">
                            {loading && (
                                <div className="mb-6 bg-black/40 border border-white/10 rounded-2xl p-5 flex items-center gap-5 z-20 overflow-hidden relative">
                                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
                                        <div
                                            className={`h-full ${theme.bg} transition-all duration-300`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" className="text-white/5" fill="none" />
                                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" className={theme.text} fill="none" strokeDasharray="150.7" strokeDashoffset={150.7 * (1 - progress / 100)} />
                                        </svg>
                                        <span className="absolute text-xs font-black text-white">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-white uppercase tracking-tight mb-1 animate-pulse">
                                            {progressStatus}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            {t("library.config.sync_text")}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={onSubmit}
                                disabled={!canStart || loading}
                                className={`w-full py-6 rounded-[20px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 transition-all shadow-2xl border backdrop-blur-xl relative overflow-hidden group
                  ${canStart && !loading
                                        ? `bg-white/5 ${theme.border} ${theme.text} hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]`
                                        : "bg-white/5 border-white/5 text-slate-500 cursor-not-allowed"
                                    }`}
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${theme.bg}`} />
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className={canStart ? theme.text : ""} />}
                                {loading ? t("library.config.generating") : modes.has("exam") && modes.size === 1 ? t("library.config.start_sim_btn") : t("library.config.generate_btn")}
                            </button>
                            <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500/50" />
                                {t("library.config.craap_active")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
