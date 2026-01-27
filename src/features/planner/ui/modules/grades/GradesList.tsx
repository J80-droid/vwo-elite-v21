import { ManualGrade } from "@shared/api/sqliteService";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, Calendar, Trash2, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";

import { getGradeColor } from "@/shared/utils/themeUtils";

interface GradesListProps {
  selectedSubject: string;
  grades: ManualGrade[];
  onDelete: (id: string) => void;
}

export const GradesList: React.FC<GradesListProps> = ({
  selectedSubject,
  grades,
  onDelete,
}) => {
  const filtered = useMemo(() => {
    if (selectedSubject === "All") return grades;
    return grades.filter((g) => g.subject === selectedSubject);
  }, [selectedSubject, grades]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-white/[0.015] border border-white/5 border-dashed rounded-[3rem] opacity-30">
        <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mb-6 relative">
          <Calculator className="w-10 h-10 text-slate-700" />
          <div className="absolute -inset-4 blur-3xl bg-indigo-500/5 -z-10" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">
          Null.archive.found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {filtered.map((grade) => {
          const color = getGradeColor(grade.grade);
          const rawPercent = (grade.grade / 10) * 100;
          const widthPercent = isNaN(rawPercent) ? 0 : Math.max(rawPercent, 10); // Min 10% width, handle NaN

          return (
            <motion.div
              key={grade.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`
                                group relative flex items-center justify-between p-6 rounded-[2rem] border cursor-pointer transition-all duration-500 hover:scale-[1.01] hover:z-20 overflow-hidden
                                bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05] shadow-2xl
                            `}
            >
              <div className="flex items-center gap-8 relative z-10 w-full">
                {/* Score Bubble */}
                <div
                  className="relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black transition-all duration-500 group-hover:scale-105 shadow-[0_10px_30px_rgba(0,0,0,0.3)] bg-black/40 border border-white/5"
                  style={{ color: color }}
                >
                  <span className="text-3xl font-mono tracking-tighter drop-shadow-md">
                    {grade.grade.toFixed(1)}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-4">
                    <h5 className="text-sm font-black text-white tracking-widest uppercase group-hover:text-indigo-400 transition-colors duration-300">
                      {grade.subject}
                    </h5>
                    {grade.description && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] opacity-50">
                        / {grade.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-400 transition-colors">
                        <TrendingUp size={12} className="text-indigo-500/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                          WEIGHT: {grade.weight}×
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-400 transition-colors">
                        <Calendar size={12} className="text-indigo-500/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                          {new Date(grade.date)
                            .toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            .toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button (Aligned Right on Hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(grade.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all active:scale-95 border border-rose-500/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Heatmap Progress Bar */}
              <div className="absolute bottom-0 left-6 right-6 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
