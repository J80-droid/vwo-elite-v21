import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, Sparkles } from "lucide-react";
import React, { useState } from "react";

import { LibrarySubject, SUBJECT_THEME_CONFIG } from "../types/library.types";

interface SubjectTileProps {
    subject: LibrarySubject;
    onClick?: () => void;
}

export const EliteSubjectTile: React.FC<SubjectTileProps> = ({
    subject,
    onClick,
}) => {
    const { t } = useTranslations();
    const [isHovered, setIsHovered] = useState(false);

    const theme = (SUBJECT_THEME_CONFIG[
        subject.theme as keyof typeof SUBJECT_THEME_CONFIG
    ] ||
        SUBJECT_THEME_CONFIG["default"] ||
        SUBJECT_THEME_CONFIG["slate"])!;
    const Icon = subject.icon;

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{
                y: -10,
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.98 }}
            className={`
        relative group cursor-pointer h-72 rounded-[2rem] overflow-hidden
        bg-obsidian-900/40 border border-white/5 backdrop-blur-md
        transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_50px_rgba(99,102,241,0.1)]
      `}
            onClick={onClick}
        >

            {/* Content Overlay */}
            <div className="relative h-full p-8 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-black/60 border border-white/10 ${theme.text} shadow-2xl`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                                {t(subject.name)}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold tracking-[0.2em] uppercase opacity-50 ${theme.text}`}>Elite Lab System</span>
                                <Sparkles size={10} className={theme.text} />
                            </div>
                        </div>
                    </div>
                    <button className="p-2 rounded-full hover:bg-white/10 text-slate-500 transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Dynamic Progress Indicator */}
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Mastery</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white italic">
                                    {subject.averageGrade !== undefined ? subject.averageGrade.toFixed(1) : "?.?"}
                                </span>
                                <span className={`text-sm font-bold ${theme.text}`}>/10</span>
                            </div>
                        </div>

                        <div className="flex gap-1 h-8 items-end">
                            {[30, 70, 45, 90, 60, 80].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.8 }}
                                    className={`w-1.5 rounded-full ${theme.bg.replace("/5", "/40")}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Tactile Footer */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {subject.nextTestDate ? "Mission Scheduled" : "Deep Learning Ready"}
                        </span>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${theme.border} ${theme.text}`}>
                            {subject.nextTestDate ? "Exam" : "Study"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hover Particles Overlay (CSS simulation) */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-indigo-500/10 to-transparent"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
