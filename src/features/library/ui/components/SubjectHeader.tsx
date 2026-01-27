import { SUBJECT_THEME_CONFIG } from "@features/library/types/library.types";
import { useTranslations } from "@shared/hooks/useTranslations";
import { ArrowLeft, Brain, Feather, GraduationCap, Scale } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

interface SubjectHeaderProps {
    subjectName: string;
    onBack: () => void;
    themeKey: string;
    storeSubjectName: string;
    hideActionButton?: boolean;
}

export const SubjectHeader: React.FC<SubjectHeaderProps> = ({
    subjectName,
    onBack,
    themeKey,
    storeSubjectName,
    hideActionButton = false,
}) => {
    const { t } = useTranslations();
    const navigate = useNavigate();
    const theme = SUBJECT_THEME_CONFIG[themeKey] || SUBJECT_THEME_CONFIG["default"]!;

    return (
        <header className="sticky top-0 z-[50] bg-[#02040a]/70 backdrop-blur-3xl pt-12 pb-10 px-6 md:px-10 border-b border-white/5 shadow-2xl -mx-6 md:-mx-10 flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-300">
            <div className="flex items-center gap-6">
                <button
                    onClick={onBack}
                    className="p-4 rounded-2xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white transition-all shadow-lg hover:scale-110 active:scale-90"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`${theme.bg} p-2 rounded-xl text-white shadow-lg`}>
                            {subjectName === "Nederlands" ? (
                                <Feather size={28} />
                            ) : subjectName === "Wiskunde" ? (
                                <Scale size={28} />
                            ) : (
                                <GraduationCap size={28} />
                            )}
                        </div>
                        <h1
                            className={`text-4xl md:text-6xl font-black uppercase tracking-tight ${theme.text} drop-shadow-2xl`}
                        >
                            {subjectName}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase opacity-60">
                            {t("library.header.subtitle")}
                        </p>
                        {hideActionButton && (
                            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/20">
                                AI Generator
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {!hideActionButton && (
                <button
                    onClick={() => navigate(`/lesson/${storeSubjectName}`)}
                    className={`flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 backdrop-blur-xl ${theme.text} font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300 shadow-2xl active:scale-95 group`}
                >
                    <Brain
                        size={20}
                        className="group-hover:scale-110 transition-transform text-indigo-400"
                    />
                    {t("library.header.new_lesson_btn")}
                </button>
            )}
        </header>
    );
};
