import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  type DropAnimation,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  CHRONOTYPE_PEAK_HOURS,
  EliteTask,
  getTaskColor,
  type PlannerSettings,
} from "@entities/planner/model/task";
import {
  getDaysUntilCE,
  getHolidaysForRegion,
  isExamPeriod,
} from "@shared/assets/data/dutchHolidays";
import { useTranslations } from "@shared/hooks/useTranslations";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import {
  AlertCircle,
  Battery,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sun,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { ReflectionModal } from "./ReflectionModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { WeeklyReviewModal } from "./WeeklyReviewModal";

// Days of the week (short) - Moved to t()
// const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

// Time slots (8:00 - 22:00)
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => i + 8);

const MONTHLY_QUOTES = [
  "The secret of your future is hidden in your daily routine.",
  "my all of your vibes say: I got this.",
  "Don't wait for the perfect moment, take the moment and make it perfect.",
  "Dream big and enjoy the little things.",
  "Sharing is caring.",
  "We age not by years, but by stories.",
  "Worrying is fantasizing in the wrong direction.",
  "Be kind to yourself.",
  "Our bodies are our gardens, our wills are the gardeners.",
  "Difficult roads lead to beautiful destinations.",
  "Health is a state of mind, wellness is a state of being.",
  "The more we share, the more we have.",
];

// Safe helper to get YYYY-MM-DD in local time
const getLocalDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const CalendarStage: React.FC = () => {
  const {
    tasks,
    settings,
    toggleComplete,
    selectTask,
    selectedTaskId,
    rescheduleTask,
    autoSyncSomtoday,
    weeklyReviews,
  } = usePlannerEliteStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeDragTask, setActiveDragTask] = useState<EliteTask | null>(null);
  const [completingTask, setCompletingTask] = useState<EliteTask | null>(null);
  const [viewingTask, setViewingTask] = useState<EliteTask | null>(null);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [selectedReviewDate, setSelectedReviewDate] = useState<string | null>(
    null,
  );
  const { t, lang } = useTranslations();
  const WEEKDAYS = (t("planner:dashboard.weekdays_short", {
    returnObjects: true,
  }) as unknown) as string[];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Calculate current week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(
      today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7,
    );

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }, [weekOffset]);

  // Background Sync on mount
  useEffect(() => {
    autoSyncSomtoday();
  }, [autoSyncSomtoday]);

  // Get tasks for each day
  const tasksByDay = useMemo(() => {
    const result: Record<string, EliteTask[]> = {};

    for (const date of weekDates) {
      const dateStr = getLocalDateStr(date);
      const dayTasks = tasks.filter((t) => t.date === dateStr);

      // Inject Weekly Review for Sundays 21:00
      if (date.getDay() === 0) {
        // Sunday
        const reviewRecord = weeklyReviews.find((r) => r.id === dateStr);
        const reviewTask: EliteTask = {
          id: `weekly_review_${dateStr}`,
          title: t("planner:dashboard.weekly_review"),
          date: dateStr,
          startTime: "21:00",
          duration: 15,
          completed: !!reviewRecord?.completed,
          type: "study", // Close enough to a task type
          priority: "high",
          energyRequirement: "low",
          subject: "Mentor",
          status: reviewRecord?.completed ? "done" : "todo",
          isFixed: false,
          isAllDay: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: "manual",
        };
        dayTasks.push(reviewTask);
      }

      result[dateStr] = dayTasks.sort((a, b) =>
        (a.startTime || "").localeCompare(b.startTime || ""),
      );
    }

    // Debug: Log first few tasks to check date format
    if (tasks.length > 0) {
      const sampleDates = tasks.slice(0, 5).map((t) => t.date);
      console.log("[Calendar] First 5 task dates:", sampleDates.join(", "));
      console.log(
        "[Calendar] Week dates:",
        weekDates.map((d) => getLocalDateStr(d)).join(", "),
      );
      const totalForWeek = Object.values(result).reduce(
        (sum, arr) => sum + arr.length,
        0,
      );
      console.log("[Calendar] Tasks found for this week:", totalForWeek);
    }

    return result;
  }, [tasks, weekDates, t, weeklyReviews]);

  // Calculate days until CE
  const daysUntilExam = getDaysUntilCE();

  // Navigation
  // const goToToday = () => setWeekOffset(0); // Deprecated in favor of inline
  const goToPrevWeek = () => setWeekOffset((w) => w - 1);
  const goToNextWeek = () => setWeekOffset((w) => w + 1);

  // Drag End Handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (over && active) {
      const taskId = active.id as string;
      // Parse new ID format: "YYYY-MM-DD|HH:MM"
      const [dateStr, timeStr] = (over.id as string).split("|");

      if (dateStr && timeStr) {
        const [hourStr, minuteStr] = timeStr.split(":");
        const hour = parseInt(hourStr ?? "0");
        const minute = parseInt(minuteStr ?? "0");

        const task = tasks.find((t) => t.id === taskId);

        // --- Metacognitive Warning (Phase 5) ---
        if (
          task &&
          task.energyRequirement === "high" &&
          settings.autoRescheduleEnabled
        ) {
          const peak = CHRONOTYPE_PEAK_HOURS[settings.chronotype];
          const isPeakHour = hour >= peak.start && hour < peak.end;

          if (!isPeakHour) {
            // Warn user about low energy planning
            const confirmMove = window.confirm(
              `${t("planner:dashboard.bio_warning_title")}\n\n` +
              t("planner:dashboard.bio_warning_desc", {
                task: task.title,
                subject: task.subject || t("planner:subject"),
                time: `${hour}:${minute.toString().padStart(2, "0")}`,
                chronotype: settings.chronotype,
                start: peak.start,
                end: peak.end,
              }),
            );
            if (!confirmMove) return; // Cancel drop
          }
        }
        // ---------------------------------------

        // Use the exact minute from the drop zone (00, 15, 30, 45)
        const newTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        console.log(
          `[Calendar] Persisting move: Task ${taskId} -> ${dateStr} ${newTime}`,
        );
        rescheduleTask(taskId, dateStr, newTime);
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveDragTask(task);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(lang, {
      day: "numeric",
      month: "short",
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // View Mode State
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  // Calculate month days for Month View
  const monthDates = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + weekOffset; // Reuse weekOffset to navigate months
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    // Add padding days from prev month
    const startPadding = (firstDay.getDay() + 6) % 7; // Mon=0
    for (let i = 0; i < startPadding; i++) {
      const d = new Date(year, month, 1 - (startPadding - i));
      days.push({ date: d, isPadding: true });
    }
    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isPadding: false });
    }
    // Add padding days for next month to fill grid (optional, but looks better)
    while (days.length % 7 !== 0) {
      const nextDay: Date = new Date(
        year,
        month,
        days.length - startPadding + 1,
      );
      days.push({ date: nextDay, isPadding: true });
    }
    return days;
  }, [weekOffset]);

  const currentMonthLabel = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + weekOffset);
    return d.toLocaleDateString(lang, { month: "long", year: "numeric" });
  }, [weekOffset, lang]);

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="h-full flex flex-col bg-gradient-to-b from-obsidian-950 to-black p-4 pt-20 overflow-hidden">
        {/* ... Header ... */}
        {/* (Header omitted for brevity, ensure it's preserved) */}
        <div className="flex flex-wrap items-center justify-between mb-8 shrink-0 px-2 gap-y-4">
          {/* ... (Existing header content) ... */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-xl shadow-2xl">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Calendar size={14} className="text-indigo-400" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
                {viewMode === "week"
                  ? `${formatDate(weekDates[0]!)} — ${formatDate(weekDates[6]!)}`
                  : currentMonthLabel}
              </span>
            </div>
            {/* ... (University Mode) ... */}
            {settings.universityMode && (
              <div className="px-4 py-2 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex items-center gap-3 backdrop-blur-md">
                <GraduationCap size={14} className="text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80">
                  VWO-Universiteit
                </span>
              </div>
            )}
          </div>
          {/* ... (View Toggle, Nav, BioRhythm, Panic) ... */}
          <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5 backdrop-blur-md">
            <button
              onClick={() => {
                setViewMode("week");
                setWeekOffset(0);
              }}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${viewMode === "week"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]"
                : "text-slate-500 hover:text-indigo-400 border border-transparent"
                }`}
            >
              {t("planner:dashboard.btn_week")}
            </button>
            <button
              onClick={() => {
                setViewMode("month");
                setWeekOffset(0);
              }}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${viewMode === "month"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]"
                : "text-slate-500 hover:text-indigo-400 border border-transparent"
                }`}
            >
              {t("planner:dashboard.btn_month")}
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2">
            <button
              onClick={goToPrevWeek}
              className="btn-elite-neon btn-elite-neon-slate !p-2 rounded-lg"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="btn-elite-neon btn-elite-neon-indigo px-4 font-black text-[10px]"
            >
              {t("planner:dashboard.btn_today")}
            </button>
            <button
              onClick={goToNextWeek}
              className="btn-elite-neon btn-elite-neon-slate !p-2 rounded-lg"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Status Bar: CE Countdown & Monthly Quote */}
        <div className="flex items-center justify-between gap-4 mb-6 px-2">
          {daysUntilExam !== null && (
            <div
              className={`px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2 relative overflow-hidden group transition-all shrink-0 ${daysUntilExam <= 30
                ? "bg-red-500/5 border border-red-500/10"
                : "bg-white/[0.02] border border-white/5"
                }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${daysUntilExam <= 30 ? "bg-red-500" : "bg-amber-500/50"}`}
              />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                {t("planner:calendar.days_until_exam", { days: daysUntilExam })}
              </span>
            </div>
          )}

          <div className="flex-1 text-right">
            <span className="text-[10px] md:text-xs text-slate-500/60 italic font-medium tracking-wide">
              "{MONTHLY_QUOTES[new Date().getMonth()]}"
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto custom-scrollbar border border-white/5 rounded-2xl bg-black/20">
          {viewMode === "week" ? (
            <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] gap-[1px] bg-white/5 min-h-full">
              {/* Time Column */}
              <div className="sticky left-0 z-10 bg-obsidian-950/95 border-r border-white/5">
                <div className="h-12 border-b border-white/5 bg-obsidian-950/50 backdrop-blur-md sticky top-0 z-20" />
                {TIME_SLOTS.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 flex items-start justify-end pr-2 pt-1 text-[10px] text-slate-500 font-mono border-b border-white/5 last:border-0"
                  >
                    {`${hour}:00`}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDates.map((date, dayIndex) => {
                const dateStr = getLocalDateStr(date);
                const dayTasks = tasksByDay[dateStr] || [];

                // Check for holidays
                const holidays = getHolidaysForRegion(
                  settings.region,
                  dateStr,
                  dateStr,
                );
                const isVacation =
                  holidays.length > 0 &&
                  (holidays[0]!.type === "vacation" ||
                    holidays[0]!.type === "public_holiday");
                const holidayName = isVacation ? holidays[0]!.nameNl : null;

                const isExam = isExamPeriod(dateStr);
                const isTodayDate = isToday(date);

                return (
                  <DayColumn
                    key={dateStr}
                    date={date}
                    dateStr={dateStr}
                    isVacation={isVacation}
                    holidayName={holidayName}
                    isExam={isExam}
                    isTodayDate={isTodayDate}
                    dayIndex={dayIndex}
                    tasks={dayTasks}
                    selectedTaskId={selectedTaskId}
                    selectTask={(id) => {
                      if (id.startsWith("weekly_review_")) {
                        const date = id.replace("weekly_review_", "");
                        setSelectedReviewDate(date);
                        setShowWeeklyReview(true);
                        return;
                      }
                      const t = tasks.find((t) => t.id === id);
                      if (t) setViewingTask(t);
                      selectTask(id);
                    }}
                    onTaskComplete={(task) => {
                      if (task.id.startsWith("weekly_review_")) {
                        const date = task.id.replace("weekly_review_", "");
                        setSelectedReviewDate(date);
                        setShowWeeklyReview(true);
                        return;
                      }
                      setCompletingTask(task);
                    }}
                    showBioRhythm={settings.showBioRhythm}
                    settings={settings}
                  />
                );
              })}
            </div>
          ) : (
            // MONTH VIEW RENDER
            <div className="h-full flex flex-col">
              {/* Month Header Days */}
              <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Month Days Grid */}
              <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-[1px] bg-white/5">
                {monthDates.map((d, i) => {
                  const dateStr = getLocalDateStr(d.date);
                  const dayTasks = tasks.filter((t) => t.date === dateStr);
                  const isTodayDate = isToday(d.date);
                  const isWeekend =
                    d.date.getDay() === 0 || d.date.getDay() === 6;

                  const holidays = getHolidaysForRegion(
                    settings.region,
                    dateStr,
                    dateStr,
                  );
                  const isVacation =
                    holidays.length > 0 &&
                    (holidays[0]!.type === "vacation" ||
                      holidays[0]!.type === "public_holiday");
                  const holidayName = isVacation ? holidays[0]!.nameNl : null;

                  return (
                    <div
                      key={i}
                      className={`
                                                relative p-1 flex flex-col gap-1 min-h-0
                                                ${d.isPadding
                          ? "bg-obsidian-950/50 opacity-40"
                          : isVacation
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                            : "bg-obsidian-950 hover:bg-white/5"
                        }
                                                ${isTodayDate ? "bg-indigo-500/10 ring-inset ring-1 ring-indigo-500/50" : ""}
                                            `}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-[10px] font-mono ml-1 mt-1 ${isTodayDate ? "text-indigo-400 font-bold" : isWeekend ? "text-slate-600" : "text-slate-400"}`}
                        >
                          {d.date.getDate()}
                        </span>
                        {isVacation && (
                          <span
                            className="text-[8px] text-emerald-400 font-bold max-w-[60px] truncate mr-1"
                            title={holidayName!}
                          >
                            {holidayName}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden px-1">
                        {dayTasks.slice(0, 4).map((t) => {
                          const taskColor = getTaskColor(t);
                          return (
                            <div
                              key={t.id}
                              className="h-1.5 w-full rounded-full cursor-pointer opacity-80 hover:opacity-100 hover:scale-110 transition-transform"
                              style={{ backgroundColor: taskColor }}
                              title={`${t.title} (${t.startTime || "Flexibel"})`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingTask(t);
                                selectTask(t.id);
                              }}
                            />
                          );
                        })}
                        {dayTasks.length > 4 && (
                          <div className="text-[8px] text-slate-600 font-bold text-center leading-none">
                            +{dayTasks.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* Drag Overlay used for smooth dragging visual */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragTask ? (
            <TaskCard
              task={activeDragTask}
              style={{
                height: `${Math.max(24, (activeDragTask.duration / 60) * 64)}px`,
              }}
              isSelected={true}
              onClick={() => { }}
              onComplete={() => { }}
              isOverlay
            />
          ) : null}
        </DragOverlay>

        <ReflectionModal
          isOpen={!!completingTask}
          taskTitle={completingTask?.title || ""}
          onClose={() => setCompletingTask(null)}
          onConfirm={(_rating, _notes) => {
            if (completingTask) {
              toggleComplete(completingTask.id);
              setCompletingTask(null);
            }
          }}
          onAutoReschedule={async () => {
            if (!completingTask) return;
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = getLocalDateStr(tomorrow);

            await rescheduleTask(
              completingTask.id,
              dateStr,
              completingTask.startTime,
            );
            alert(
              t("planner:dashboard.auto_reschedule_alert", {
                task: completingTask.title,
              }),
            );
          }}
        />

        <TaskDetailModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
        />

        <WeeklyReviewModal
          isOpen={showWeeklyReview}
          onClose={() => setShowWeeklyReview(false)}
          reviewDate={selectedReviewDate || ""}
        />
      </div>
    </DndContext>
  );
};

// ===== DAY COLUMN COMPONENT =====
interface DayColumnProps {
  date: Date;
  dateStr: string;
  isVacation: boolean;
  holidayName?: string | null;
  isExam: boolean;
  isTodayDate: boolean;
  dayIndex: number;
  tasks: EliteTask[];
  selectedTaskId: string | null;
  selectTask: (id: string) => void;
  onTaskComplete: (task: EliteTask) => void;
  showBioRhythm: boolean;
  settings: PlannerSettings;
}

const DayColumn: React.FC<DayColumnProps> = ({
  date,
  dateStr,
  isVacation,
  holidayName,
  isExam,
  isTodayDate,
  dayIndex,
  tasks,
  selectedTaskId,
  selectTask,
  onTaskComplete,
  showBioRhythm,
  settings,
}) => {
  const { t } = useTranslations();
  const WEEKDAYS = (t("planner:dashboard.weekdays_short", {
    returnObjects: true,
  }) as unknown) as string[];
  // Calculate conflicts locally for display
  const tasksWithConflicts = useMemo(() => {
    return tasks.map((task) => {
      if (!task.startTime) return { ...task, hasConflict: false };

      const timeParts = task.startTime.split(":").map(Number);
      const startMinutes = (timeParts[0] || 0) * 60 + (timeParts[1] || 0);
      const endMinutes = startMinutes + task.duration;

      const hasConflict = tasks.some((other) => {
        if (other.id === task.id || !other.startTime) return false;
        const otherParts = other.startTime.split(":").map(Number);
        const otherStart = (otherParts[0] || 0) * 60 + (otherParts[1] || 0);
        const otherEnd = otherStart + other.duration;

        return startMinutes < otherEnd && endMinutes > otherStart;
      });

      return { ...task, hasConflict };
    });
  }, [tasks]);

  return (
    <div
      className={`relative flex flex-col ${isVacation
        ? "bg-cyan-500/5"
        : isExam
          ? "bg-red-500/5"
          : isTodayDate
            ? "bg-indigo-500/10"
            : ""
        }`}
    >
      {/* Day Header */}
      <div
        className={`h-12 sticky top-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm border-b border-white/10 ${isTodayDate
          ? "bg-indigo-500/20 border-indigo-500"
          : "bg-obsidian-900/90"
          }`}
      >
        <span
          className={`text-[10px] uppercase tracking-wider ${isTodayDate ? "text-indigo-400" : "text-slate-500"
            }`}
        >
          {WEEKDAYS[dayIndex]}
        </span>
        <span
          className={`text-sm font-bold ${isTodayDate ? "text-white" : "text-slate-300"
            }`}
        >
          {date.getDate()}
        </span>
        {isVacation && (
          <div className="absolute top-1 right-1 flex items-center gap-1">
            <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-tighter opacity-80 hidden md:block">
              {holidayName || t("planner:dashboard.vacation")}
            </span>
            <Sun className="w-3 h-3 text-cyan-400" />
          </div>
        )}
        {isExam && (
          <AlertCircle className="w-3 h-3 text-red-400 absolute top-1 right-1" />
        )}
      </div>

      {/* Time Slots & Drop Zones */}
      <div className="relative flex-1">
        {/* Render background grid lines & drop zones */}
        {/* Render background grid lines & drop zones */}
        {TIME_SLOTS.map((hour) => (
          <div key={hour} className="relative h-16 border-b border-white/5">
            {/* 4 Droppable slots per hour (15 min per slot) */}
            {[0, 15, 30, 45].map((minute) => (
              <DroppableSlot
                key={`${dateStr}|${hour}|${minute}`}
                id={`${dateStr}|${hour}:${minute.toString().padStart(2, "0")}`} // Ensure format matches parser
                hour={hour}
                minute={minute}
                showBioRhythm={showBioRhythm}
                peakStart={settings.peakHoursStart}
                peakEnd={settings.peakHoursEnd}
              />
            ))}
          </div>
        ))}

        {/* Task Cards - Rendered absolutely on top */}
        {tasksWithConflicts.map((task) => {
          if (!task.startTime) return null;

          const [h = 0, m = 0] = task.startTime.split(":").map(Number);
          const topOffset = (h - 8) * 64 + (m / 60) * 64;
          const height = Math.max(24, (task.duration / 60) * 64);

          // Skip tasks outside visible hours
          if (h < 8 || h >= 22) return null;

          return (
            <DraggableTaskCard
              key={task.id}
              task={task as EliteTask}
              style={{
                top: `${topOffset}px`,
                height: `${height}px`,
              }}
              isSelected={task.id === selectedTaskId}
              onClick={() => selectTask(task.id)}
              onComplete={() => onTaskComplete(task as EliteTask)} // Trigger modal via parent
              hasConflict={task.hasConflict}
              isProcrastinating={(task.rescheduleCount || 0) > 2}
            />
          );
        })}
      </div>
    </div>
  );
};

// ===== DROPPABLE SLOT =====
interface DroppableSlotProps {
  id: string;
  hour: number;
  minute: number; // Added minute
  showBioRhythm: boolean;
  peakStart: number;
  peakEnd: number;
}

const DroppableSlot: React.FC<DroppableSlotProps> = ({
  id,
  hour,
  minute,
  showBioRhythm,
  peakStart,
  peakEnd,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Calculate energy level visualization
  const isPeak = hour >= peakStart && hour < peakEnd;
  const energyStyle = showBioRhythm
    ? isPeak
      ? "bg-gradient-to-r from-amber-500/5 to-transparent border-l-2 border-l-amber-500/30"
      : "bg-gradient-to-r from-blue-900/5 to-transparent opacity-50"
    : "";

  return (
    <div
      ref={setNodeRef}
      className={`absolute w-full h-4 left-0 transition-all duration-200 z-0
                ${isOver ? "bg-indigo-500/20 z-20" : ""}
                ${energyStyle}
            `}
      style={{
        top: `${(minute / 60) * 100}%`,
      }}
    >
      {/* Only show label for full hour, and maybe small tick for others if needed */}
      {minute === 0 && (
        <div className="absolute top-0 left-0 w-full border-t border-white/5" />
      )}

      {/* Show time label on hover or drag over */}
      {(isOver || minute === 0) && (
        <span
          className={`absolute -left-1 top-0 text-[9px] -translate-x-full select-none
                    ${isOver ? "text-indigo-400 font-bold z-30" : "text-slate-800"}
                 `}
        >
          {hour}:{minute.toString().padStart(2, "0")}
        </span>
      )}

      {isOver && (
        <div className="absolute inset-x-0 inset-y-0.5 border-2 border-indigo-500/50 rounded-sm pointer-events-none" />
      )}
    </div>
  );
};

// ===== DRAGGABLE TASK EXPORT =====
const DraggableTaskCard: React.FC<TaskCardProps> = (props) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.task.id,
  });

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={props.style}
        className="absolute left-1 right-1 bg-white/5 border border-white/10 rounded-md animate-pulse opacity-50 z-0"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={props.style}
      className="absolute left-1 right-1 z-10 touch-none"
    >
      <TaskCard
        {...props}
        style={{ ...props.style, top: 0, position: "relative" }}
      />
    </div>
  );
};

// ===== TASK CARD COMPONENT =====
interface TaskCardProps {
  task: EliteTask;
  style: React.CSSProperties;
  isSelected: boolean;
  onClick: () => void;
  onComplete: () => void;
  isOverlay?: boolean;
  hasConflict?: boolean;
  isProcrastinating?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  style,
  isSelected,
  onClick,
  onComplete,
  isOverlay,
  hasConflict,
  isProcrastinating,
}) => {
  const baseColor = getTaskColor(task);

  // DEBUG: Calendar Render Logging
  // console.log(`[CalendarTask] ID: ${task.id} | Title: ${task.title} | Subject: ${typeof task.subject === 'string' ? task.subject : JSON.stringify(task.subject)} | Explicit Color: ${task.color} | Resolved Color: ${baseColor}`);

  // Priority Border Logic (Subtler now, uses glow)
  const priorityClass = {
    critical: "animate-pulse ring-1 ring-red-500",
    high: "ring-1 ring-amber-500/50",
    medium: "",
    low: "opacity-90",
  }[task.priority];

  const isCompact = task.duration < 30;

  return (
    <div
      className={`rounded-lg overflow-hidden cursor-pointer backdrop-blur-md
                transition-all duration-300 hover:scale-[1.02] hover:z-30 group
                ${isSelected ? "ring-1 ring-white shadow-2xl z-30 scale-[1.02]" : priorityClass}
                ${task.completed ? "opacity-50 grayscale" : ""}
                ${isOverlay ? "shadow-2xl ring-1 ring-indigo-400 scale-105" : ""}
                ${hasConflict ? "ring-1 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : ""}
            `}
      style={{
        ...style,
        // Ultra-modern neon glassmorphism
        backgroundColor: `${baseColor}10`, // 6% opacity (very subtle)
        border: `1px solid ${baseColor}30`, // 20% opacity border
        borderLeft: `3px solid ${baseColor}`, // Solid indicator
        boxShadow:
          isSelected || isOverlay
            ? `0 0 20px ${baseColor}40`
            : `0 0 10px -5px ${baseColor}00`,
      }}
      onClick={onClick}
    >
      <div
        className={`h-full flex relative ${isCompact ? "flex-row items-center px-1" : "flex-col p-1.5"}`}
      >
        {/* Active Glow Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at center, ${baseColor}20 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div
          className={`flex items-center justify-between gap-1 relative z-10 w-full ${isCompact ? "leading-none" : "mb-0.5 items-start"}`}
        >
          <span
            className={`font-bold truncate flex-1 flex items-center gap-1 uppercase tracking-wide
                            ${isCompact ? "text-[9px]" : "text-[10px] leading-tight"}
                        `}
            style={{ color: baseColor }} // Neon text color
          >
            {isProcrastinating && <span>🐌</span>}
            {task.type === "recovery" && (
              <Battery size={10} className="text-lime-200 fill-lime-200/50" />
            )}
            {task.title}
          </span>

          {!isOverlay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`shrink-0 rounded-full border transition-all duration-300 flex items-center justify-center
                                ${isCompact ? "w-3 h-3" : "w-3.5 h-3.5"}
                                ${task.completed
                  ? "bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  : "border-white/10 hover:border-white/40 bg-black/20"
                }`}
            >
              {task.completed && (
                <CheckCircle2
                  className={`${isCompact ? "w-2 h-2" : "w-2.5 h-2.5"} text-white stroke-[3px]`}
                />
              )}
            </button>
          )}
        </div>

        {/* Details (Time) */}
        {task.duration >= 30 && (
          <div className="mt-auto relative z-10 flex items-center gap-1">
            <div
              className="h-0.5 w-2 rounded-full opacity-50"
              style={{ backgroundColor: baseColor }}
            />
            <span className="text-[9px] font-medium text-slate-400/80 uppercase tracking-tighter">
              {task.startTime}
            </span>
          </div>
        )}

        {hasConflict && (
          <div className="absolute bottom-1 right-1 bg-red-500/20 rounded-full p-0.5 z-20 animate-pulse">
            <AlertTriangleIcon className="w-3 h-3 text-red-500" />
          </div>
        )}
      </div>
    </div>
  );
};

const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);
