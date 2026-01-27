import { useTranslations } from "@shared/hooks/useTranslations";
import { motion } from "framer-motion";
import { BookOpen, Clock, MoreHorizontal } from "lucide-react";
import React from "react";

import { LibrarySubject, SUBJECT_THEME_CONFIG } from "../types/library.types";

interface SubjectTileProps {
  subject: LibrarySubject;
  onClick?: () => void;
}

export const SubjectTile: React.FC<SubjectTileProps> = ({
  subject,
  onClick,
}) => {
  const { t } = useTranslations();
  const theme = (SUBJECT_THEME_CONFIG[
    subject.theme as keyof typeof SUBJECT_THEME_CONFIG
  ] ||
    SUBJECT_THEME_CONFIG["default"] ||
    SUBJECT_THEME_CONFIG["slate"])!;
  const Icon = subject.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
                relative p-6 rounded-3xl border backdrop-blur-md transition-all duration-300
                group cursor-pointer flex-col justify-between h-56 flex
                ${theme.border} ${theme.bg} ${theme.shadow} hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]
            `}
      onClick={onClick}
    >
      {/* Top Row: Identity */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl bg-black/40 border border-white/5 ${theme.text} `}
          >
            <Icon size={24} />
          </div>
          <div>
            <h3
              className={`text-xl font-black tracking-tight text-white uppercase`}
            >
              {t(subject.name)}
            </h3>
            <p
              className={`text-[10px] font-bold opacity-60 uppercase tracking-widest ${theme.text} `}
            >
              Elite N6T
            </p>
          </div>
        </div>
        <button className="text-slate-500 hover:text-white transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Middle Row: Performance (Gauge) */}
      <div className="flex items-center gap-6 mt-2">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-black/40"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray="226.19"
              strokeDashoffset={226.19 * (1 - (subject.averageGrade || 0) / 10)}
              strokeLinecap="round"
              className={`${theme.text} `}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-white leading-none">
              {subject.averageGrade !== undefined
                ? subject.averageGrade.toFixed(1)
                : "-"}
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase">
              AVG
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {/* Gauge Text Info */}
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${theme.text} `}>
              {subject.averageGrade === undefined
                ? t("library.tile.no_data")
                : subject.averageGrade >= 8
                  ? t("library.tile.status.mastery")
                  : subject.averageGrade >= 6
                    ? t("library.tile.status.on_track")
                    : t("library.tile.status.warning")}
            </span>
            <span className="text-xs text-slate-400">
              {subject.averageGrade === undefined
                ? t("library.tile.no_tests_taken")
                : t("library.tile.since_last_test")}
            </span>
          </div>

          {/* Mini Sparkline simulation */}
          <div className="h-6 flex items-end gap-0.5 opacity-50">
            {[40, 60, 45, 70, 80, 75, 90].map((h, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-t-sm ${theme.bg.replace("/5", "/40")} `}
                style={{ height: `${h}% ` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Context (Urgency) */}
      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {subject.nextTestDate ? (
            <>
              <Clock size={14} className="text-rose-400" />
              <span className="text-xs font-bold text-rose-300">
                {t("library.tile.test_planned")}
              </span>
            </>
          ) : (
            <>
              <BookOpen size={14} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-400">
                {subject.nextLessonTopic
                  ? `Up next: ${subject.nextLessonTopic} `
                  : t("library.tile.no_planning")}
              </span>
            </>
          )}
        </div>

        {/* Countdown / Timer (Removed mock data) */}
        <div className="font-mono text-sm font-bold text-slate-500 bg-black/30 px-2 py-1 rounded">
          {subject.nextTestDate ? subject.nextTestName || "TEST" : "STUDY"}
        </div>
      </div>

      {/* Glow Effect */}
      <div
        className={`absolute -inset-1 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${theme.bg.replace("/5", "/100")} `}
      />
    </motion.div>
  );
};
