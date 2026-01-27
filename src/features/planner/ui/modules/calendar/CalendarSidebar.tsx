/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CalendarSidebar - Quick actions and mini calendar
 */
import {
  EliteTask,
  getEnergyForSubject,
  TaskPriority,
} from "@entities/planner/model/task";
import { useMotivationStore } from "@features/planner/model/motivationStore";
import { useExternalIntegration } from "@shared/api/externalIntegration";
import { mapAfspraakToEliteTask } from "@shared/api/somtodayService";
import { INITIAL_SUBJECTS } from "@shared/assets/data/initialSubjects";
import { useTranslations } from "@shared/hooks/useTranslations";
// import { jsPDF } from 'jspdf';
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import {
  Activity,
  BookOpen,
  Calendar,
  Check,
  ChevronDown, // Used in quick add dropdown
  ChevronUp,
  CloudDownload,
  Loader2,
  RefreshCw,
  // Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { RecurrenceModal } from "./RecurrenceModal";
import { SomtodayLoginModal } from "./SomtodayLoginModal";

// ... (Helpers remain same)
const getLocalDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const MOTIVATIONAL_QUOTES = [
  "The secret of your future is hidden in your daily routine.",
  "Small steps every day add up to big results.",
  "Don't wish for it, work for it.",
  "Your potential is endless.",
];

export const CalendarSidebar: React.FC = () => {
  const {
    addTask,
    selectedTaskId,
    tasks,
    settings,
    updateSettings,
    replaceSomtodayTasks,
  } = usePlannerEliteStore();
  const { t, lang } = useTranslations();
  const {
    sources,
    connect,
    disconnect,
    markSomtodayConnected,
    syncSomtodaySchedule,
  } = useExternalIntegration();

  // State
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<string | null>(null);
  const { logFeedback } = useMotivationStore();
  const [showSomtodayLogin, setShowSomtodayLogin] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowSomtodayLogin(true);
    window.addEventListener("somtoday-open-login", handleOpen);
    return () => window.removeEventListener("somtoday-open-login", handleOpen);
  }, []);

  const handleSomtodayDirectLogin = async () => {
    setShowSomtodayLogin(true);
  };

  // Quick Add State
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddSubject, setQuickAddSubject] = useState("");
  const [quickAddType, setQuickAddType] = useState<
    "study" | "homework" | "personal" | "exam"
  >("study");
  const [quickAddDate, setQuickAddDate] = useState(getLocalDateStr(new Date()));
  const [quickAddStartTime, setQuickAddStartTime] = useState("09:00");
  const [quickAddDuration, setQuickAddDuration] = useState(30);
  const [quickAddPriority, setQuickAddPriority] =
    useState<TaskPriority>("medium");
  const [quickAddRecurrence, setQuickAddRecurrence] = useState<
    "none" | "daily" | "weekdays" | "weekly" | "biweekly" | "monthly" | "custom"
  >("none");

  // Custom Recurrence State
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [customRecurrence, setCustomRecurrence] = useState<any>(null);

  // Advanced Options State
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [quickAddDescription, setQuickAddDescription] = useState("");
  const [quickAddEnergy, setQuickAddEnergy] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [quickAddGradeGoal, setQuickAddGradeGoal] = useState("");
  const [quickAddWeight, setQuickAddWeight] = useState("");

  // Get selected task details
  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId)
    : null;

  const handleQuickAdd = () => {
    if (!quickAddTitle.trim()) return;

    const now = new Date().toISOString();
    const tasksToAdd: EliteTask[] = [];

    // Determine number of instances based on pattern
    let instances = 1;

    if (quickAddRecurrence === "custom" && customRecurrence) {
      instances = customRecurrence.occurrences || 1;
    } else {
      switch (quickAddRecurrence) {
        case "daily":
          instances = 14;
          break; // 2 weeks of dailies
        case "weekdays":
          instances = 14;
          break; // ~3 weeks of weekdays
        case "weekly":
          instances = 8;
          break;
        case "biweekly":
          instances = 4;
          break;
        case "monthly":
          instances = 6;
          break;
        default:
          instances = 1;
      }
    }

    const currentDate = new Date(quickAddDate);

    for (let i = 0; i < instances; i++) {
      // Logic for calculating next date based on pattern
      if (i > 0) {
        if (quickAddRecurrence === "custom" && customRecurrence) {
          // Simplified custom logic for now: treat as daily/interval
          // Ideally we use customRecurrence.frequency and .interval here
          if (customRecurrence.frequency === "daily") {
            currentDate.setDate(
              currentDate.getDate() + customRecurrence.interval,
            );
          } else if (customRecurrence.frequency === "weekly") {
            // Simple weekly interval
            currentDate.setDate(
              currentDate.getDate() + 7 * customRecurrence.interval,
            );
          } else if (customRecurrence.frequency === "monthly") {
            currentDate.setMonth(
              currentDate.getMonth() + customRecurrence.interval,
            );
          }
        } else if (quickAddRecurrence === "daily") {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (quickAddRecurrence === "weekdays") {
          do {
            currentDate.setDate(currentDate.getDate() + 1);
          } while (currentDate.getDay() === 0 || currentDate.getDay() === 6); // Skip Sun(0) & Sat(6)
        } else if (quickAddRecurrence === "weekly") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (quickAddRecurrence === "biweekly") {
          currentDate.setDate(currentDate.getDate() + 14);
        } else if (quickAddRecurrence === "monthly") {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      const dateStr = getLocalDateStr(currentDate);

      const newTask: EliteTask = {
        id: `task-${Date.now()}-${i}`,
        title:
          quickAddTitle + (instances > 1 ? ` (${i + 1}/${instances})` : ""),
        date: dateStr,
        startTime: quickAddStartTime || "09:00",
        duration: quickAddDuration,
        isFixed: false,
        isAllDay: false,
        type: quickAddType,
        priority: quickAddPriority,
        energyRequirement: showAdvancedOptions
          ? quickAddEnergy
          : quickAddSubject
            ? getEnergyForSubject(quickAddSubject)
            : "medium",
        ...(quickAddSubject ? { subject: quickAddSubject } : {}),
        ...(quickAddDescription ? { description: quickAddDescription } : {}),
        ...(quickAddGradeGoal ? { gradeGoal: Number(quickAddGradeGoal) } : {}),
        ...(quickAddWeight ? { weight: Number(quickAddWeight) } : {}),
        completed: false,
        status: "todo",
        createdAt: now,
        updatedAt: now,
        source: "manual",
        ...(quickAddRecurrence !== "none"
          ? {
            recurrencePattern:
              quickAddRecurrence === "custom" ? "custom" : quickAddRecurrence,
          }
          : {}),
      };
      tasksToAdd.push(newTask);
    }

    // Add all tasks
    tasksToAdd.forEach((t) => addTask(t));

    // Reset
    setQuickAddTitle("");
    setQuickAddType("study");
    setQuickAddRecurrence("none");
    setQuickAddPriority("medium");
    setQuickAddDescription("");
    setQuickAddStartTime("09:00");
    setQuickAddGradeGoal("");
    setQuickAddWeight("");
    setShowAdvancedOptions(false);
    setCustomRecurrence(null);
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const today = new Date();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 100);
    doc.text(`Weekrapport: VWO Elite Planner`, 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${t("planner:dashboard.date_label")}: ${today.toLocaleDateString(lang)}`,
      20,
      30,
    );

    // Stats
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    const completedCount = tasks.filter((t) => t.completed).length;
    const totalCount = tasks.length;
    const hardTasks = tasks.filter((t) => t.reflection?.rating === "hard");

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(t("planner:dashboard.status"), 20, 45);

    doc.setFontSize(12);
    doc.text(
      `• ${t("planner:dashboard.stats_labels.completed")}: ${completedCount} / ${totalCount}`,
      25,
      55,
    );
    doc.text(
      `• Productiviteit: ${Math.round((completedCount / totalCount) * 100) || 0}%`,
      25,
      65,
    );

    // Hard Tasks (Attention points)
    if (hardTasks.length > 0) {
      doc.text(`Aandachtspunten:`, 20, 80);
      hardTasks.forEach((taskItem, i) => {
        doc.text(
          `- ${taskItem.title} (${taskItem.subject || t("planner:subjects.none")})`,
          25,
          90 + i * 10,
        );
      });
    }

    doc.save(`weekrapport-${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Quick Add Form */}
      <div className="p-4 bg-obsidian-800/50 border border-white/10 rounded-xl space-y-3">
        <input
          type="text"
          placeholder={t("planner:dashboard.quick_add_placeholder")}
          value={quickAddTitle}
          onChange={(e) => {
            const val = e.target.value;
            setQuickAddTitle(val);

            // Auto-detection
            const lower = val.toLowerCase();
            if (
              lower.includes("huiswerk") ||
              lower.includes(" hs ") ||
              lower.startsWith("hs ") ||
              lower.endsWith(" hs")
            ) {
              setQuickAddType("homework");
            } else if (
              lower.includes("toets") ||
              lower.includes("proefwerk") ||
              lower.includes(" exam")
            ) {
              setQuickAddType("exam");
            } else if (
              lower.includes("afspraak") ||
              lower.includes("persoonlijk")
            ) {
              setQuickAddType("personal");
            }
          }}
          className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg 
                        text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          autoFocus
        />

        <div className="grid grid-cols-[3fr,2fr] gap-2">
          <select
            value={quickAddSubject}
            onChange={(e) => setQuickAddSubject(e.target.value)}
            className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg 
                            text-white text-xs focus:outline-none focus:border-indigo-500 appearance-none
                            [&>option]:bg-obsidian-900 [&>option]:text-white"
          >
            <option value="" className="bg-obsidian-900 text-slate-400">
              {t("planner:dashboard.choose_subject_mini")}
            </option>
            {INITIAL_SUBJECTS.map((s) => (
              <option
                key={s.id}
                value={s.legacyName}
                className="bg-obsidian-900 text-white"
              >
                {t(s.name, s.legacyName)}
              </option>
            ))}
          </select>

          <select
            value={quickAddPriority}
            onChange={(e) =>
              setQuickAddPriority(e.target.value as TaskPriority)
            }
            className={`w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg 
                                text-xs focus:outline-none focus:border-indigo-500 appearance-none font-bold uppercase tracking-wider
                                [&>option]:bg-obsidian-900 [&>option]:text-white
                                ${quickAddPriority === "critical"
                ? "text-red-400"
                : quickAddPriority === "high"
                  ? "text-amber-400"
                  : quickAddPriority === "medium"
                    ? "text-blue-400"
                    : "text-slate-400"
              }`}
          >
            <option value="low" className="text-slate-400">
              Low
            </option>
            <option value="medium" className="text-blue-400">
              Medium
            </option>
            <option value="high" className="text-amber-400">
              High
            </option>
            <option value="critical" className="text-red-400 font-bold">
              CRITICAL
            </option>
          </select>
        </div>

        <div className="relative">
          <select
            value={quickAddType}
            onChange={(e) => setQuickAddType(e.target.value as any)}
            className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg 
                            text-white text-xs focus:outline-none focus:border-indigo-500 appearance-none
                            [&>option]:bg-obsidian-900 [&>option]:text-white pr-8"
          >
            <option value="study" className="bg-obsidian-900">
              {t("planner:task_types.study")}
            </option>
            <option value="homework" className="bg-obsidian-900">
              {t("planner:task_types.homework")}
            </option>
            <option value="exam" className="bg-obsidian-900">
              {t("planner:task_types.exam")}
            </option>
            <option value="personal" className="bg-obsidian-900">
              {t("planner:task_types.personal")}
            </option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <ChevronDown size={14} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={quickAddDate}
            onChange={(e) => setQuickAddDate(e.target.value)}
            className="w-full px-2 py-2 bg-black/50 border border-white/10 rounded-lg 
                            text-white text-xs focus:outline-none focus:border-indigo-500
                            [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
          />
          <input
            type="time"
            value={quickAddStartTime}
            onChange={(e) => setQuickAddStartTime(e.target.value)}
            className="w-full px-2 py-2 bg-black/50 border border-white/10 rounded-lg 
                            text-white text-xs focus:outline-none focus:border-indigo-500
                            [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>

        <div className="grid grid-cols-1">
          <select
            value={quickAddDuration}
            onChange={(e) => setQuickAddDuration(Number(e.target.value))}
            className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg 
                            text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none
                            [&>option]:bg-obsidian-900 [&>option]:text-white"
          >
            <option value={15} className="bg-obsidian-900">
              15 {t("planner:dashboard.unit_min")}
            </option>
            <option value={30} className="bg-obsidian-900">
              30 {t("planner:dashboard.unit_min")}
            </option>
            <option value={45} className="bg-obsidian-900">
              45 {t("planner:dashboard.unit_min")}
            </option>
            <option value={60} className="bg-obsidian-900">
              1 {t("planner:dashboard.unit_hour")}
            </option>
            <option value={90} className="bg-obsidian-900">
              1.5 {t("planner:dashboard.unit_hour")}
            </option>
            <option value={120} className="bg-obsidian-900">
              2 {t("planner:dashboard.unit_hour")}
            </option>
          </select>
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-wider font-bold"
        >
          {showAdvancedOptions ? (
            <>
              {t("planner:dashboard.collapse")} <ChevronUp size={12} />
            </>
          ) : (
            <>
              {t("planner:dashboard.more_options")} <ChevronDown size={12} />
            </>
          )}
        </button>

        {showAdvancedOptions && (
          <div className="space-y-3 pt-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
            {/* Energy Level */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-400 uppercase font-bold">
                {t("planner:dashboard.energy_level")}
              </label>
              <div className="flex bg-black/50 rounded-lg p-0.5 border border-white/10">
                {(["low", "medium", "high"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setQuickAddEnergy(level)}
                    className={`px-2 py-1 rounded text-[10px] uppercase font-bold transition-colors
                                            ${quickAddEnergy === level
                        ? level === "high"
                          ? "bg-red-500/20 text-red-400"
                          : level === "medium"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        : "text-slate-600 hover:text-slate-400"
                      }`}
                  >
                    {t(`planner:priorities.${level}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <textarea
              placeholder={t("planner:dashboard.notes_placeholder")}
              value={quickAddDescription}
              onChange={(e) => setQuickAddDescription(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg 
                                text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[60px]"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={t("planner:dashboard.grade_goal_placeholder")}
                value={quickAddGradeGoal}
                onChange={(e) => setQuickAddGradeGoal(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg 
                                    text-white text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
              <input
                type="number"
                placeholder={t("planner:dashboard.weight_placeholder")}
                value={quickAddWeight}
                onChange={(e) => setQuickAddWeight(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg 
                                    text-white text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
          </div>
        )}

        <select
          value={quickAddRecurrence}
          onChange={(e) => {
            const val = e.target.value as any;
            if (val === "custom") {
              setShowRecurrenceModal(true);
            }
            setQuickAddRecurrence(val);
          }}
          className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg 
                        text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none
                        [&>option]:bg-obsidian-900 [&>option]:text-white"
        >
          <option value="none" className="bg-obsidian-900">
            {t("planner:dashboard.recurrence_options.none")}
          </option>
          <option value="daily" className="bg-obsidian-900">
            {t("planner:dashboard.recurrence_options.daily")}
          </option>
          <option value="weekdays" className="bg-obsidian-900">
            {t("planner:dashboard.recurrence_options.weekdays")}
          </option>
          <option value="weekly" className="bg-obsidian-900">
            {t("planner:dashboard.recurrence_options.weekly")}
          </option>
          <option value="biweekly" className="bg-obsidian-900">
            {t("planner:dashboard.recurrence_options.biweekly")}
          </option>
          <option value="monthly" className="bg-obsidian-900">
            {t("planner:dashboard.recurrence_options.monthly")}
          </option>
          <option
            value="custom"
            className="bg-obsidian-900 text-indigo-300 font-bold"
          >
            {t("planner:dashboard.recurrence_options.custom")}
          </option>
        </select>

        <button
          onClick={handleQuickAdd}
          disabled={!quickAddTitle.trim()}
          className="relative w-full py-2 px-4 
                        bg-indigo-500/5 hover:bg-indigo-500/10
                        border border-indigo-500/30 hover:border-indigo-400/50
                        text-indigo-400 hover:text-indigo-300
                        disabled:opacity-50 disabled:cursor-not-allowed
                        rounded-lg font-medium text-sm transition-all duration-300
                        shadow-[0_0_20px_-5px_rgba(99,102,241,0.1)]
                        hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)]"
        >
          {t("planner:dashboard.btn_add")}
        </button>
      </div>

      {/* 2. Selected Task Details */}
      {selectedTask && (
        <div className="p-4 bg-obsidian-800/50 border border-white/10 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t("planner:dashboard.selected_task_label")}
          </h4>

          <div>
            <h3 className="text-white font-medium">{selectedTask.title}</h3>
            <p className="text-sm text-slate-400 mt-1">
              {selectedTask.subject && (
                <span className="capitalize">{selectedTask.subject}</span>
              )}
              {selectedTask.topic && ` • ${selectedTask.topic}`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-black/30 rounded">
              <span className="text-slate-500">
                {t("planner:dashboard.date_label")}
              </span>
              <p className="text-white">{selectedTask.date}</p>
            </div>
            <div className="p-2 bg-black/30 rounded">
              <span className="text-slate-500">
                {t("planner:dashboard.time_label")}
              </span>
              <p className="text-white">
                {selectedTask.startTime || t("planner:flexible")}
              </p>
            </div>
            <div className="p-2 bg-black/30 rounded">
              <span className="text-slate-500">
                {t("planner:dashboard.duration_label")}
              </span>
              <p className="text-white">
                {selectedTask.duration} {t("planner:dashboard.unit_min")}
              </p>
            </div>
            <div className="p-2 bg-black/30 rounded">
              <span className="text-slate-500">
                {t("planner:dashboard.priority_label")}
              </span>
              <p
                className={`capitalize ${selectedTask.priority === "critical"
                  ? "text-red-400"
                  : selectedTask.priority === "high"
                    ? "text-amber-400"
                    : "text-white"
                  }`}
              >
                {selectedTask.priority}
              </p>
            </div>
          </div>

          {selectedTask.linkedContentId && (
            <button
              className="w-full flex items-center justify-center gap-2 py-2 
                            bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 
                            rounded-lg text-emerald-300 text-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              {t("planner:dashboard.open_content")}
            </button>
          )}
        </div>
      )}

      {/* Motivation Quote Display */}
      {currentQuote && (
        <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl animate-in slide-in-from-bottom-2 duration-300 shadow-[0_0_20px_rgba(99,102,241,0.1)] relative group">
          <p className="text-xs md:text-sm text-indigo-300 italic text-center font-bold leading-relaxed tracking-wide mb-8">
            "{currentQuote}"
          </p>

          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                logFeedback(currentQuote, "like");
                setCurrentQuote(null); // Close on feedback? Or keep open? User said "registreerd", imply passive. But let's keep open or maybe close. Usually feedback closes toast.
                // Let's keep it open for the full duration unless dismissed, but "V" usually implies "Acknowledged/Good".
                // User requirement: "wanneer de gebruiker op V klikt dan moet dit geregistreerd worden".
              }}
              className="p-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 transition-colors"
              title={t("planner:motivation.like")}
            >
              <Check size={14} strokeWidth={3} />
            </button>
            <button
              onClick={() => {
                logFeedback(currentQuote, "dislike");
                setCurrentQuote(null);
              }}
              className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
              title={t("planner:motivation.dismiss")}
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>

          {/* Progress bar for timeout visualization (Optional but nice for 10s) */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500/30 animate-[width_10s_linear_forwards] w-full origin-left" />
        </div>
      )}

      {/* General Actions (Panic/Bio/Motiv/Export) - Icon Only Row */}
      <div className="pt-4 mt-4 border-t border-white/5 flex gap-2">
        <button
          onClick={() => {
            const startDate = getLocalDateStr(new Date());
            const endDate = getLocalDateStr(
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            );
            usePlannerEliteStore
              .getState()
              .rescheduleNonCriticalTasks(startDate, endDate);
          }}
          className="flex-1 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all"
          title={t("planner:dashboard.panic_tooltip")}
        >
          <RefreshCw size={18} />
        </button>

        <button
          onClick={() =>
            updateSettings({ showBioRhythm: !settings.showBioRhythm })
          }
          className={`flex-1 h-10 flex items-center justify-center rounded-xl transition-all ${settings.showBioRhythm ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-400" : "bg-white/5 border border-white/10 text-slate-400 hover:text-indigo-400"}`}
          title={t("planner:dashboard.bio_tooltip")}
        >
          <Activity
            size={18}
            className={settings.showBioRhythm ? "animate-pulse" : ""}
          />
        </button>

        <button
          onClick={() => {
            const quotes = (t("planner:motivation.quotes", {
              returnObjects: true,
            }) as unknown) as string[];
            const randomQuote = Array.isArray(quotes)
              ? quotes[Math.floor(Math.random() * quotes.length)]
              : MOTIVATIONAL_QUOTES[
              Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
              ];
            setCurrentQuote(randomQuote || null);
            setTimeout(() => setCurrentQuote(null), 10000); // 10 seconds duration
          }}
          className="flex-1 h-10 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all group"
          title={t("planner:dashboard.motivation_tooltip")}
        >
          {/* Replaced Sparkles with custom motivation icon using mask for color control */}
          <div
            className="w-6 h-6 bg-current group-hover:scale-125 transition-transform"
            style={{
              maskImage: "url(/motivationicon.png)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: "url(/motivationicon.png)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
        </button>

        <button
          onClick={() => handleExportPDF()}
          className="flex-1 h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all"
          title={t("planner:dashboard.export_pdf_tooltip")}
        >
          <BookOpen size={18} />
        </button>
      </div>

      {/* 3. Stats Section (Deze Week) */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {t("planner:dashboard.this_week")}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<Target className="w-4 h-4 text-emerald-400" />}
            label={t("planner:dashboard.stats_labels.completed")}
            value={tasks.filter((t) => t.completed).length.toString()}
          />
          <StatCard
            icon={<Calendar className="w-4 h-4 text-blue-400" />}
            label={t("planner:dashboard.stats_labels.planned")}
            value={tasks.filter((t) => !t.completed).length.toString()}
          />
          <StatCard
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            label={t("planner:dashboard.stats_labels.high_priority")}
            value={tasks
              .filter((t) => t.priority === "high" || t.priority === "critical")
              .length.toString()}
          />
          <StatCard
            icon={<RefreshCw className="w-4 h-4 text-orange-400" />}
            label={t("planner:dashboard.stats_labels.repair")}
            value={tasks
              .filter((t) => t.type === "repair" && !t.completed)
              .length.toString()}
          />
        </div>
      </div>

      {/* 4. Integrations List (Moved under Deze Week) */}
      <div className="space-y-2 p-4 bg-white/[0.02] rounded-2xl border border-white/5 backdrop-blur-md">
        <h4 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mb-3 px-1">
          {t("planner:dashboard.integrations")}
        </h4>
        <div className="space-y-3">
          {sources.map((source) => (
            <div key={source.id} className="flex flex-col gap-2 group px-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`w-2 h-2 rounded-full ${source.status === "connected"
                        ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        : source.status === "connecting"
                          ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                          : source.status === "error"
                            ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            : "bg-slate-700"
                        }`}
                    />
                    {source.status === "connected" && (
                      <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40" />
                    )}
                    {source.status === "connecting" && (
                      <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-40" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="group-hover:text-slate-200 transition-colors uppercase tracking-wider">
                      {source.name}
                    </span>
                    {source.status === "connected" && source.schoolName && (
                      <span className="text-[8px] text-slate-500 normal-case tracking-normal">
                        {source.schoolName}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (source.status === "connected") {
                      disconnect(source.name);
                    } else if (source.name === "Somtoday") {
                      handleSomtodayDirectLogin();
                    } else {
                      connect(source.name);
                    }
                  }}
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all duration-300 ${source.status === "connected"
                    ? "bg-red-500/5 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
                    : "bg-cyan-500/5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40"
                    }`}
                >
                  {source.status === "connected"
                    ? t("planner:dashboard.disconnect")
                    : source.status === "connecting"
                      ? t("planner:dashboard.connecting")
                      : t("planner:dashboard.connect")}
                </button>
              </div>

              {/* Sync button for connected Somtoday */}
              {source.name === "Somtoday" && source.status === "connected" && (
                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    try {
                      // 1. Sync fresh data FIRST (don't clear if this fails)
                      const schedule = await syncSomtodaySchedule();

                      // Check if we got valid data
                      if (schedule && schedule.length > 0) {
                        const newTasks = schedule.map(mapAfspraakToEliteTask);

                        // Atomic replacement (No flicker, no data loss)
                        await replaceSomtodayTasks(newTasks);

                        console.log(
                          `[Somtoday] Imported ${newTasks.length} fresh appointments (Atomic Replacement)`,
                        );
                      } else {
                        console.warn(
                          "[Somtoday] Sync returned no data, skipping update",
                        );
                      }
                    } catch (err) {
                      console.error("[Somtoday] Sync failed:", err);
                      // Do NOT clear tasks on error
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing}
                  className="w-full text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 
                                        bg-emerald-500/10 border border-emerald-500/20 rounded-lg
                                        text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        flex items-center justify-center gap-2 transition-all"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />{" "}
                      {t("planner:loading")}
                    </>
                  ) : (
                    <>
                      <CloudDownload className="w-3 h-3" />{" "}
                      {t("planner:dashboard.sync_rooster")}
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <SomtodayLoginModal
        isOpen={showSomtodayLogin}
        onClose={() => setShowSomtodayLogin(false)}
        onSuccess={() => {
          markSomtodayConnected();
          setShowSomtodayLogin(false);
        }}
      />

      <RecurrenceModal
        isOpen={showRecurrenceModal}
        onClose={() => setShowRecurrenceModal(false)}
        onSave={(settings) => setCustomRecurrence(settings)}
      />
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all duration-300 relative overflow-hidden">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 group-hover:border-white/10 transition-colors">
        {icon}
      </div>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
        {label}
      </span>
    </div>
    <p className="text-2xl font-black text-white tracking-tighter">{value}</p>

    {/* Decoration */}
    <div className="absolute top-0 right-0 w-12 h-12 bg-white/[0.02] rounded-bl-[40px] pointer-events-none transition-transform group-hover:scale-110" />
  </div>
);
