import {
  deleteManualGradeSQL,
  getManualGradesSQL,
  ManualGrade,
} from "@shared/api/sqliteService";
import { calculateGradeStats, GradeStats } from "@shared/lib/gradeCalculations";
import { LayoutGroup, motion } from "framer-motion";
import { AlertCircle, Plus, TrendingUp } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

import { AddGradeModal } from "./AddGradeModal";
import { GradeAnalytics } from "./GradeAnalytics";
import { GradeControlCenter } from "./GradeControlCenter";
import { GradesList } from "./GradesList";

export const GradeOverview: React.FC = () => {
  const [grades, setGrades] = useState<ManualGrade[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "grade">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const refreshGrades = useCallback(async () => {
    const data = await getManualGradesSQL();
    setGrades(data);
  }, []);

  React.useEffect(() => {
    refreshGrades();
  }, [refreshGrades]);

  const stats = useMemo<GradeStats>(() => {
    return calculateGradeStats(grades);
  }, [grades]);

  const sortedGrades = useMemo(() => {
    return [...grades].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === "desc" ? b.grade - a.grade : a.grade - b.grade;
      }
    });
  }, [grades, sortBy, sortOrder]);

  const subjectList = useMemo(() => {
    const subjects = Array.from(new Set(grades.map((g) => g.subject)));
    return ["All", ...subjects.sort()];
  }, [grades]);

  return (
    <LayoutGroup>
      {/* 
                SCROLL ARCHITECTURE UPGRADE: 
                Removed fixed height (h-full) and overflow-hidden to allow natural page scrolling.
                Reduced top padding to remove dead space, relying on natural flow.
            */}
      <div className="min-h-screen flex flex-col bg-black pt-16 md:pt-4">
        {/* 1. ELITE HEADER & STATS */}
        <div className="px-6 py-6 border-b border-white/5 relative bg-white/[0.01]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 relative z-10">
            {/* Title Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter italic leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                GRADES<span className="text-indigo-500">.</span>
              </h1>
              <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[9px] mt-3 ml-1 opacity-70">
                Autonomous.Analytics.Engine
              </p>
            </motion.div>

            {/* Quick Stats - Compacted */}
            <motion.div
              className="flex items-center gap-5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div
                className={`text-5xl md:text-6xl font-black tracking-tighter transition-colors duration-1000 ${stats.overallAverage >= 5.5 ? "text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.3)]" : "text-rose-400 drop-shadow-[0_0_25px_rgba(251,113,133,0.3)]"}`}
              >
                {stats.overallAverage.toFixed(2)}
              </div>
              <div className="h-12 w-px bg-white/10 mx-2" />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  System Avg
                </span>
                <span
                  className={`text-xs font-black uppercase tracking-[0.2em] ${stats.overallAverage >= 5.5 ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {stats.overallAverage >= 5.5
                    ? "Elite.Status"
                    : "Critical.Focus"}
                </span>
              </div>

              <button
                onClick={() => setIsAdding(true)}
                className="ml-6 py-3 px-6 bg-white/[0.05] hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group transition-all hover:scale-105 active:scale-95"
              >
                <Plus
                  size={18}
                  className="group-hover:rotate-90 transition-transform duration-500"
                />
                <span className="hidden md:inline">COMMIT.RESULT</span>
                <span className="md:hidden">ADD</span>
              </button>
            </motion.div>
          </div>

          {/* Subject Averages Strip (Scrollable) */}
          {stats.subjectAverages.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar-hide">
              {stats.subjectAverages.map((s, idx) => (
                <motion.div
                  key={s.subject}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="flex items-center gap-3 px-4 py-2 bg-white/[0.015] border border-white/5 rounded-xl group hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-default shadow-lg flex-shrink-0"
                >
                  <div className="text-[9px] font-black text-slate-500 group-hover:text-white uppercase tracking-wider transition-colors">
                    {s.subject}
                  </div>
                  <div
                    className={`text-[13px] font-black tracking-tighter ${s.average >= 5.5 ? "text-emerald-400/70 group-hover:text-emerald-400" : "text-rose-400/70 group-hover:text-rose-400"} transition-all`}
                  >
                    {s.average.toFixed(1)}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/5 group-hover:bg-white/20 transition-colors" />
                </motion.div>
              ))}
            </div>
          )}

          {/* Atmosphere */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />
        </div>

        {/* 2. MAIN CONTENT AREA - Unlocked Scrolling */}
        {/* Removed overflow-y-auto and fixed heights. Now flows naturally. */}
        <div className="flex-1 p-6 md:p-8 relative">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Summary Alert - Compacted */}
            {stats.overallAverage < 5.5 && stats.totalGrades > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-3xl flex items-center gap-4 text-rose-400/80 backdrop-blur-md shadow-2xl"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 animate-pulse">
                  <AlertCircle size={20} className="text-rose-500" />
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                  Operational Warning: Global performance index indicates
                  critical focus required.
                </div>
              </motion.div>
            )}

            <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-6 md:p-10 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group/main">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                <div>
                  <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-3">
                    <TrendingUp size={14} className="text-indigo-500/60" />
                    ARCHIVE.PERFORMANCE
                  </h2>
                  <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em] mt-1 italic">
                    Neural.Verification.Stream
                  </p>
                </div>
                <GradeControlCenter
                  selectedSubject={selectedSubject}
                  subjects={subjectList}
                  onSubjectChange={setSelectedSubject}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  sortOrder={sortOrder}
                  onSortOrderToggle={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                />
              </div>

              <div className="space-y-16 relative z-10">
                <section className="space-y-6">
                  <GradesList
                    selectedSubject={selectedSubject}
                    grades={sortedGrades}
                    onDelete={async (id) => {
                      await deleteManualGradeSQL(id);
                      refreshGrades();
                    }}
                  />
                </section>

                <section className="pt-12 border-t border-white/[0.05]">
                  <GradeAnalytics stats={stats} />
                </section>
              </div>

              {/* Corner Glow */}
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Modal for adding grades */}
        <AddGradeModal
          isOpen={isAdding}
          onClose={() => setIsAdding(false)}
          onSuccess={refreshGrades}
        />
      </div>
    </LayoutGroup>
  );
};
