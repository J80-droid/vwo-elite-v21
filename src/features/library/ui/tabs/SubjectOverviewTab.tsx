import { useTranslations } from "@shared/hooks/useTranslations";
import {
    Brain,
    CheckCircle2,
    FileText,
    Layers,
    Play,
    Search,
    Sparkles,
    X
} from "lucide-react";
import React from "react";

import { SavedLesson, UploadedMaterial } from "../../../../shared/types/study";

// Helper component to handle Blob URL lifecycle safely
const BlobImage: React.FC<{ blob?: Blob | File; fallback?: string; className?: string }> = ({ blob, fallback, className }) => {
    const [url, setUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!blob) return;
        const objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [blob]);

    if (!url && !fallback) return null;
    return <img src={url || fallback} alt="" className={className} />;
};

interface SubjectOverviewTabProps {
    subjectName: string;
    theme: { bg: string; text: string; border: string };
    ui: {
        searchQuery: string;
        setSearchQuery: (s: string) => void;
        lessonSearchQuery: string;
        setLessonSearchQuery: (s: string) => void;
        setSelectedImage: (s: string | null) => void;
    };
    filteredMaterials: UploadedMaterial[];
    filteredLessons: SavedLesson[];
    masteryValue: number;
    // Actions
    handleDeleteMaterial: (id: string) => void;
    setExpandedLessonId: (id: string | null) => void;
}

export const SubjectOverviewTab: React.FC<SubjectOverviewTabProps> = ({
    subjectName,
    theme,
    ui,
    filteredMaterials,
    filteredLessons,
    masteryValue,
    handleDeleteMaterial,
    setExpandedLessonId,
}) => {
    const { t } = useTranslations();

    return (
        <div className="flex flex-col gap-10">
            {/* BIBLIOTHEEK - NOW AT TOP */}
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between shrink-0 px-2">
                    <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                        <Layers className="text-slate-500" size={24} />
                        {t("library.library.title")}: <span className="text-slate-500 ml-1">{subjectName}</span>
                    </h2>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={ui.searchQuery}
                            onChange={(e) => ui.setSearchQuery(e.target.value)}
                            placeholder={t("library.library.search_placeholder")}
                            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all w-48"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMaterials.length === 0 ? (
                        <div className="col-span-full h-40 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-3xl p-10 text-center">
                            <Search size={32} className="mb-2 opacity-10" />
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t("library.library.no_sources")}</p>
                        </div>
                    ) : (
                        filteredMaterials.map((res) => (
                            <button
                                key={res.id}
                                onClick={() => {
                                    if (res.type === "image") {
                                        const url = res.blob ? URL.createObjectURL(res.blob) : res.content;
                                        ui.setSelectedImage(url);
                                    }
                                }}
                                className="text-left bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all group cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                aria-label={`Open ${res.name}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors shrink-0 overflow-hidden">
                                        {res.type === "image" ? (
                                            <BlobImage
                                                blob={res.blob}
                                                fallback={res.content.startsWith("data:image") ? res.content : undefined}
                                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100"
                                            />
                                        ) : <FileText size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors line-clamp-1 uppercase tracking-tight">{res.name}</h4>
                                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{res.type.toUpperCase()}</span>
                                    </div>
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteMaterial(res.id);
                                        }}
                                        className="p-1.5 hover:bg-rose-500/10 text-slate-700 hover:text-rose-500 rounded-lg transition-all"
                                    >
                                        <X size={14} />
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            {/* LES BIBLIOTHEEK - BELOW */}
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between shrink-0 px-2">
                    <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                        <Brain className={theme.text} size={24} />
                        Output: <span className="text-slate-500 ml-1">Les Bibliotheek</span>
                    </h2>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={ui.lessonSearchQuery}
                            onChange={(e) => ui.setLessonSearchQuery(e.target.value)}
                            placeholder="Zoek lessen..."
                            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all w-48"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredLessons.length === 0 ? (
                        <div className="col-span-full h-60 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-[32px] p-10 text-center bg-white/[0.01]">
                            <Sparkles size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest opacity-50 text-center">Genereer je eerste module</p>
                        </div>
                    ) : (
                        filteredLessons.map((lesson) => (
                            <button
                                key={lesson.id}
                                onClick={() => setExpandedLessonId(lesson.id)}
                                className="w-full text-left bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 p-8 rounded-3xl hover:border-blue-500/40 transition-all group cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                aria-label={`Open les: ${lesson.title}`}
                            >
                                <div className="absolute top-0 right-0 p-6">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-blue-500 group-hover:text-black transition-all shadow-xl">
                                        <Play size={20} fill="currentColor" className="ml-1" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 pr-14">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border bg-white/5 ${theme.text} ${theme.border} uppercase tracking-widest`}>Module</span>
                                        {masteryValue > 80 && <CheckCircle2 size={14} className="text-emerald-500" />}
                                    </div>
                                    <h4 className="font-black text-white text-xl group-hover:text-blue-400 transition-colors uppercase tracking-tight leading-tight">{lesson.title}</h4>
                                    <div className="flex items-center gap-6 mt-6">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Mastery Level</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full ${theme.bg} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} style={{ width: `${masteryValue}%` }}></div>
                                                </div>
                                                <span className="text-sm font-black text-white">{masteryValue}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
