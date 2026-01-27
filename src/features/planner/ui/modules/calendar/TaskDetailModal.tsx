/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EliteTask,
  getEnergyForSubject,
  getTaskColor,
} from "@entities/planner/model/task";
import { INITIAL_SUBJECTS } from "@shared/assets/data/initialSubjects";
import { useTranslations } from "@shared/hooks/useTranslations";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import {
  AlertCircle,
  ArrowRight,
  Battery,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Edit2,
  Target,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ===== HELPERS =====
const getLocalDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface TaskDetailModalProps {
  task: EliteTask | null;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
}) => {
  const navigate = useNavigate();
  const { toggleComplete, deleteTask, updateTask, addTask } =
    usePlannerEliteStore();
  const { t, lang } = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [isMarkingHard, setIsMarkingHard] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [difficultyScore, setDifficultyScore] = useState(5);

  const [editedTask, setEditedTask] = useState<EliteTask | null>(null);

  React.useEffect(() => {
    if (task) {
      setEditedTask(task);
    }
  }, [task]);

  if (!task) return null;

  const accentColor = getTaskColor(task);

  // --- Handlers ---
  const handleOpenLibrary = () => {
    if (task.subject) {
      const subjectName =
        typeof task.subject === "string"
          ? task.subject
          : (task.subject as any).defaultName;
      const subject = INITIAL_SUBJECTS.find(
        (s) =>
          s.legacyName?.toLowerCase() === subjectName.toLowerCase() ||
          s.name?.toLowerCase() === subjectName.toLowerCase(),
      );
      if (subject) {
        navigate(`/library?subject=${subject.id}`);
        onClose();
      }
    }
  };

  const handleDelete = () => {
    if (window.confirm(t("planner:dashboard.task_detail.delete_confirm"))) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleSave = () => {
    if (editedTask) {
      updateTask(task.id, editedTask);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  const handleConfirmDifficulty = () => {
    // Didactic Loop Logic: Calculate Frequency based on Score (0-10)
    // 10 = Very Hard -> Daily Review (3 days)
    // 7-9 = Hard -> Every other day (2 days)
    // 4-6 = Medium -> Just once tomorrow
    // 0-3 = Easy -> No extra review needed (but we log it)

    updateTask(task.id, {
      reflection: {
        rating: "hard",
        notes: `Difficulty Score: ${difficultyScore}/10`,
      },
    });

    if (difficultyScore >= 4) {
      let interval = 1;
      let count = 1;

      if (difficultyScore >= 7) {
        interval = 2; // Every 2 days
        count = 2;
      }
      if (difficultyScore === 10) {
        interval = 1; // Daily
        count = 3;
      }

      // Create review tasks
      const newDates: string[] = [];
      for (let i = 0; i < count; i++) {
        const reviewDate = new Date();
        reviewDate.setDate(reviewDate.getDate() + 1 + i * interval);
        const dateStr = getLocalDateStr(reviewDate);

        // Format for display (e.g., "12 jan")
        const displayDate = reviewDate.toLocaleDateString(lang, {
          day: "numeric",
          month: "short",
        });
        newDates.push(displayDate);

        const reviewTask: EliteTask = {
          id: `review-${Date.now()}-${i}`,
          title: `Review: ${task.title} (${i + 1}/${count})`,
          date: dateStr,
          duration: 15 + (difficultyScore - 5) * 2, // Longer review for harder tasks
          startTime: "09:00",
          isFixed: false,
          isAllDay: false,
          subject: task.subject,
          type: "review",
          priority: difficultyScore >= 8 ? "critical" : "high",
          energyRequirement: difficultyScore >= 8 ? "high" : "medium",
          status: "todo",
          completed: false,
          source: "ai",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          description: `${t("planner:dashboard.task_detail.difficulty_desc")} (Score: ${difficultyScore}/10).`,
          linkedContentId: task.id,
        };
        addTask(reviewTask);
      }
      setScheduledDates(newDates);

      // 3. Trigger Custom Success UI instead of alert
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setShowSuccess(false);
          setIsMarkingHard(false);
          setScheduledDates([]);
        }, 300); // Reset state after modal closes
      }, 3000);
    } else {
      // For low scores, just close (or show brief success)
      setScheduledDates([]);
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setShowSuccess(false);
          setIsMarkingHard(false);
        }, 300);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative bg-obsidian-950 border w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ borderColor: `${accentColor}30` }}
      >
        {/* Header / Banner */}
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 0 15px ${accentColor}`,
          }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-500 hover:text-white transition-colors z-10 bg-black/20 rounded-full"
        >
          <X size={18} />
        </button>

        <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {t("planner:dashboard.task_detail.didactic_loop_planned")}
              </h3>

              {scheduledDates.length > 0 ? (
                <div className="text-center space-y-2 w-full px-8">
                  <p className="text-slate-400 text-sm">
                    {t("planner:dashboard.task_detail.review_sessions_added")}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {scheduledDates.map((date, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-emerald-300"
                      >
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-center text-sm px-4">
                  {t("planner:dashboard.task_detail.no_reviews_needed")}
                </p>
              )}
            </div>
          ) : isMarkingHard ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">
                {t("planner:dashboard.task_detail.how_hard_was_it")}
              </h2>
              <p className="text-slate-400 text-sm">
                {t("planner:dashboard.task_detail.difficulty_desc")}
              </p>

              <div className="py-6 px-2">
                <div className="flex justify-between text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">
                  <span>{t("planner:dashboard.task_detail.easy")} (0)</span>
                  <span>{t("planner:dashboard.task_detail.medium")} (5)</span>
                  <span>{t("planner:dashboard.task_detail.hard")} (10)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={difficultyScore}
                  onChange={(e) => setDifficultyScore(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center mt-4">
                  <span
                    className={`text-4xl font-black drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                      difficultyScore >= 8
                        ? "text-red-500"
                        : difficultyScore >= 5
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {difficultyScore}
                  </span>
                </div>
              </div>

              <button
                onClick={handleConfirmDifficulty}
                className="w-full btn-elite-neon btn-elite-neon-emerald py-3"
              >
                {t("planner:dashboard.task_detail.confirm_plan")}
              </button>
              <button
                onClick={() => setIsMarkingHard(false)}
                className="w-full py-2 text-slate-500 hover:text-white text-sm"
              >
                {t("planner:dashboard.task_detail.cancel")}
              </button>
            </div>
          ) : isEditing && editedTask ? (
            /* EDIT MODE */
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-4">
                {t("planner:dashboard.task_detail.edit_task")}
              </h2>

              {/* Title & Subject */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold">
                    {t("planner:dashboard.task_detail.title")}
                  </label>
                  <input
                    type="text"
                    value={editedTask.title}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, title: e.target.value })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold">
                    {t("planner:dashboard.task_detail.subject")}
                  </label>
                  <select
                    value={
                      typeof editedTask.subject === "object"
                        ? (editedTask.subject as any).defaultName
                        : editedTask.subject
                    }
                    onChange={(e) => {
                      const newSubject = e.target.value;
                      const defaultEnergy = getEnergyForSubject(newSubject);
                      setEditedTask({
                        ...editedTask,
                        subject: newSubject,
                        energyRequirement: defaultEnergy, // Auto-update energy based on subject
                      });
                    }}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none appearance-none [&>option]:bg-obsidian-900"
                  >
                    <option value="" className="text-slate-400">
                      {t("planner:dashboard.task_detail.general_no_subject")}
                    </option>
                    {INITIAL_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.legacyName}>
                        {t(`planner:subjects.${s.id}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold">
                    {t("planner:dashboard.task_detail.date")}
                  </label>
                  <input
                    type="date"
                    value={editedTask.date}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, date: e.target.value })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold">
                      {t("planner:dashboard.task_detail.start")}
                    </label>
                    <input
                      type="time"
                      value={editedTask.startTime || ""}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold">
                      {t("planner:dashboard.task_detail.duration")}
                    </label>
                    <select
                      value={editedTask.duration}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          duration: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value={15}>
                        15{t("planner:dashboard.unit_min")}
                      </option>
                      <option value={30}>
                        30{t("planner:dashboard.unit_min")}
                      </option>
                      <option value={45}>
                        45{t("planner:dashboard.unit_min")}
                      </option>
                      <option value={60}>
                        1{t("planner:dashboard.unit_hour")}
                      </option>
                      <option value={90}>
                        1.5{t("planner:dashboard.unit_hour")}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Priority, Energy & Type */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold">
                    {t("planner:dashboard.task_detail.priority")}
                  </label>
                  <select
                    value={editedTask.priority}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold">
                    {t("planner:dashboard.task_detail.energy")}
                  </label>
                  <select
                    value={editedTask.energyRequirement || "medium"}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        energyRequirement: e.target.value as any,
                      })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="low">Low 🔋</option>
                    <option value="medium">Medium ⚡</option>
                    <option value="high">High 🔥</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold">
                    {t("planner:dashboard.task_detail.type") || "Type"}
                  </label>
                  <select
                    value={editedTask.type}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="study">
                      {t("planner:task_types.study")}
                    </option>
                    <option value="homework">
                      {t("planner:task_types.homework")}
                    </option>
                    <option value="exam">{t("planner:task_types.exam")}</option>
                    <option value="lesson">
                      {t("planner:task_types.lesson")}
                    </option>
                    <option value="personal">
                      {t("planner:task_types.personal")}
                    </option>
                    <option value="review">
                      {t("planner:task_types.review")}
                    </option>
                    <option value="pws">{t("planner:task_types.pws")}</option>
                  </select>
                </div>
              </div>

              {/* Academic Goal */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <label className="text-[10px] uppercase text-purple-400 font-bold">
                    {t("planner:dashboard.task_detail.grade_goal")}
                  </label>
                  <input
                    type="number"
                    placeholder="7.5"
                    value={editedTask.gradeGoal || ""}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        gradeGoal: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-purple-400 font-bold">
                    {t("planner:dashboard.task_detail.weight")}
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={editedTask.weight || ""}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        weight: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold">
                  {t("planner:dashboard.task_detail.notes")}
                </label>
                <textarea
                  value={editedTask.description || ""}
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none min-h-[80px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 btn-elite-neon btn-elite-neon-emerald"
                >
                  {t("planner:dashboard.task_detail.save")}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 btn-elite-neon btn-elite-neon-slate"
                >
                  {t("planner:dashboard.task_detail.cancel")}
                </button>
              </div>
            </div>
          ) : (
            /* VIEW MODE */
            <>
              {/* 1. ℹ️ Kerninformatie */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md bg-white/5 border border-white/10"
                    style={{
                      color: accentColor,
                      borderColor: `${accentColor}30`,
                    }}
                  >
                    {task.subject
                      ? t(`planner:subjects.${task.subject}`)
                      : t("planner:dashboard.task_detail.general")}
                  </span>
                  {task.priority === "critical" && (
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-1 animate-pulse">
                      <AlertCircle size={10} /> Critical
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-white leading-tight">
                  {task.title}
                </h2>

                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon size={14} className="text-slate-500" />
                    <span>
                      {new Date(task.date).toLocaleDateString(lang, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  {task.startTime && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-500" />
                      <span>
                        {task.startTime}
                        <span className="opacity-50 ml-1">
                          ({task.duration}
                          {t("planner:dashboard.unit_min")})
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {task.description && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-300 leading-relaxed italic">
                    "{task.description}"
                  </div>
                )}
              </div>

              {/* 2. 🧠 Elite Context */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    {t("planner:dashboard.task_detail.energy")}
                  </span>
                  <div className="flex items-center gap-2">
                    <Battery
                      size={16}
                      className={`
                                        ${task.energyRequirement === "high" ? "text-red-400" : task.energyRequirement === "medium" ? "text-amber-400" : "text-emerald-400"}
                                    `}
                    />
                    <span className="text-xs text-white capitalize">
                      {task.energyRequirement || "Medium"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Status
                  </span>
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        task.completed
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-slate-500 group-hover:border-emerald-500"
                      }`}
                    >
                      {task.completed && (
                        <CheckCircle2 size={10} className="text-white" />
                      )}
                    </div>
                    <span
                      className={`text-xs ${task.completed ? "text-emerald-400 line-through" : "text-white"}`}
                    >
                      {task.completed
                        ? t("planner:dashboard.task_detail.completed")
                        : t("planner:dashboard.task_detail.todo")}
                    </span>
                  </button>
                </div>

                {/* Academic Goal */}
                {task.gradeGoal && (
                  <div className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-purple-400" />
                      <span className="text-xs text-purple-200">
                        {t("planner:dashboard.task_detail.goal_label")}{" "}
                        <span className="font-bold text-white">
                          {task.gradeGoal}
                        </span>
                        {task.weight && (
                          <span className="opacity-60 ml-1">
                            ({task.weight}x)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. ⚡ Acties */}
              <div className="pt-2 flex flex-col gap-2">
                {task.subject && (
                  <button
                    onClick={handleOpenLibrary}
                    className="w-full py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen size={16} style={{ color: accentColor }} />
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                        {t("planner:dashboard.task_detail.open_material")}
                      </span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all"
                    />
                  </button>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {/* Edit */}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-elite-neon btn-elite-neon-indigo !px-2 flex-1"
                  >
                    <Edit2 size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {t("planner:dashboard.task_detail.edit")}
                    </span>
                  </button>

                  {/* Mark Hard (Didactic Loop) */}
                  <button
                    onClick={() => setIsMarkingHard(true)}
                    className="btn-elite-neon btn-elite-neon-purple !px-2 flex-1"
                    title={t("planner:dashboard.task_detail.difficult_desc")}
                  >
                    <AlertCircle size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {t("planner:dashboard.task_detail.difficult_short")}
                    </span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={handleDelete}
                    className="btn-elite-neon btn-elite-neon-rose !px-2 flex-1"
                  >
                    <Trash2 size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {t("planner:dashboard.task_detail.delete")}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
