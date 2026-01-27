import { EliteTask } from "@entities/planner/model/task";
import { useTranslations } from "@shared/hooks/useTranslations";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  Calendar,
  ChevronRight,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import { GradeInputModal } from "./examComponents/GradeInputModal";
import { RetrogradeAIModal } from "./examComponents/RetrogradeAIModal";

export const ExamsStage: React.FC = () => {
  const { t } = useTranslations();
  const { tasks, toggleComplete, selectTask, selectedTaskId, updateTask } =
    usePlannerEliteStore();
  const [filter, setFilter] = useState<"SO" | "SE" | "CE" | "all">("all");
  const [activeAiTask, setActiveAiTask] = useState<EliteTask | null>(null);
  const [activeGradeModal, setActiveGradeModal] = useState<{
    task: EliteTask;
    type: "achieved" | "target";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter exam tasks
  const examTasks = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          (t.type === "exam" || t.examType) &&
          (filter === "all" || t.examType === filter) &&
          (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.subject?.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, filter, searchQuery]);

  const handleSaveGrade = (grade: number) => {
    if (activeGradeModal) {
      const { task, type } = activeGradeModal;
      if (type === "achieved") {
        updateTask(task.id, { gradeAchieved: grade, completed: grade >= 5.5 });
      } else {
        updateTask(task.id, { gradeGoal: grade });
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden pt-20">
      {/* 1. ELITE HEADER & FILTERS */}
      <div className="p-8 pb-6 border-b border-white/5 relative bg-white/[0.01]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Trophy className="text-indigo-400" size={28} />
              {t("planner:modules.exams")}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {examTasks.length} {t("planner:modules.exams").toLowerCase()}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">
                PTA SYNC ENABLED
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder={t("planner:dashboard.homework.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/30 w-64 transition-all focus:bg-white/[0.08]"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
              {(["all", "SO", "SE", "CE"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-xl transition-all ${
                    filter === f
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />
      </div>

      {/* 2. EXAM GRID AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6 relative">
        <AnimatePresence mode="popLayout">
          {examTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[60vh] flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center mb-6 relative group">
                <Award className="w-12 h-12 text-slate-700 group-hover:text-indigo-400 transition-colors" />
                <div className="absolute -inset-4 blur-3xl bg-indigo-500/5 -z-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t("planner:exams.no_exams")}
              </h3>
              <p className="text-sm text-slate-500 max-w-xs">
                {t("planner:exams.start_pta")}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
              {examTasks.map((task) => (
                <ExamCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onToggle={() => toggleComplete(task.id)}
                  onClick={() => selectTask(task.id)}
                  onAiPlan={() => setActiveAiTask(task)}
                  onSetGrade={(type) => setActiveGradeModal({ task, type })}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* MODALS */}
      {activeAiTask && (
        <RetrogradeAIModal
          task={activeAiTask}
          isOpen={!!activeAiTask}
          onClose={() => setActiveAiTask(null)}
        />
      )}

      {activeGradeModal && (
        <GradeInputModal
          isOpen={!!activeGradeModal}
          onClose={() => setActiveGradeModal(null)}
          onSave={handleSaveGrade}
          initialValue={
            activeGradeModal.type === "achieved"
              ? activeGradeModal.task.gradeAchieved || 0
              : activeGradeModal.task.gradeGoal || 0
          }
          title={activeGradeModal.task.title}
          type={activeGradeModal.type}
        />
      )}

      {/* Background Atmosphere */}
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none -mr-48 -mb-48" />
    </div>
  );
};

interface ExamCardProps {
  task: EliteTask;
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
  onAiPlan: () => void;
  onSetGrade: (type: "achieved" | "target") => void;
}

const ExamCard: React.FC<ExamCardProps> = ({
  task,
  isSelected,
  onToggle,
  onClick,
  onAiPlan,
  onSetGrade,
}) => {
  const { t } = useTranslations();

  const isCE = task.examType === "CE";
  const isSE = task.examType === "SE";
  const colors = isCE
    ? {
        neon: "#f43f5e",
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/20",
      }
    : isSE
      ? {
          neon: "#f59e0b",
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/20",
        }
      : {
          neon: "#6366f1",
          bg: "bg-indigo-500/10",
          text: "text-indigo-400",
          border: "border-indigo-500/20",
        };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`
                group relative flex flex-col bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 backdrop-blur-md cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.05]
                ${isSelected ? "border-white/20 ring-1 ring-white/10" : ""}
                ${task.completed ? "opacity-60" : ""}
            `}
    >
      {/* Status Type & Weight */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            {task.examType || "TOETS"}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
            <TrendingUp size={12} className="text-slate-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none pt-0.5">
              Weging {task.weight || 1}x
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            task.completed
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
              : "bg-white/5 text-slate-700 hover:bg-white/10 hover:text-emerald-400"
          }`}
        >
          {task.completed ? <Trophy size={18} /> : <AlertCircle size={18} />}
        </button>
      </div>

      {/* Title & Subject */}
      <div className="mb-8">
        <h3 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight leading-none mb-2">
          {task.title}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"
            style={{ color: colors.neon }}
          >
            {task.subject}
          </span>
        </div>
      </div>

      {/* Grades Section */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSetGrade("achieved");
          }}
          className={`
                        p-4 rounded-[1.5rem] border transition-all duration-300 group/grade
                        ${
                          task.gradeAchieved !== undefined
                            ? task.gradeAchieved >= 5.5
                              ? "bg-emerald-500/5 border-emerald-500/20"
                              : "bg-rose-500/5 border-rose-500/20"
                            : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]"
                        }
                    `}
        >
          <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
            {t("planner:exams.entered_grade")}
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-black ${task.gradeAchieved !== undefined ? (task.gradeAchieved >= 5.5 ? "text-emerald-400" : "text-rose-400") : "text-slate-700"}`}
            >
              {task.gradeAchieved?.toFixed(1) || "--"}
            </span>
            {task.gradeAchieved === undefined && (
              <span className="text-[10px] font-bold text-slate-600 group-hover/grade:text-slate-400 transition-colors">
                SET
              </span>
            )}
          </div>
        </div>

        <div
          onClick={(e) => {
            e.stopPropagation();
            onSetGrade("target");
          }}
          className="p-4 bg-white/5 border border-white/5 rounded-[1.5rem] hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 group/target"
        >
          <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
            {t("planner:exams.target")}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">
              {task.gradeGoal?.toFixed(1) || "--"}
            </span>
            {task.gradeGoal === undefined && (
              <span className="text-[10px] font-bold text-slate-600 group-hover/target:text-slate-400 transition-colors">
                SET
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <Calendar size={12} className="text-indigo-400" />
            {task.date}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAiPlan();
            }}
            className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl transition-all border border-indigo-500/20 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
          >
            <Sparkles size={12} />
            AI PLAN
          </button>
          <button className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 group-hover:border-white/10">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Accent Line */}
      <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </motion.div>
  );
};
