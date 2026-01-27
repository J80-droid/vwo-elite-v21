import "./UltimateDashboard.css";

import { EliteTask } from "@entities/planner/model/task";
import { useMotivationStore } from "@features/planner/model/motivationStore";
import {
  getCurrentAcademicYearRange,
  normalizeSubjectName,
} from "@shared/api/somtodayService";
import { getManualGradesSQL, ManualGrade } from "@shared/api/sqliteService";
import { MOTIVATIONAL_QUOTES } from "@shared/assets/data/motivationQuotes";
import { useSettings } from "@shared/hooks/useSettings";
import { useTranslations } from "@shared/hooks/useTranslations";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import { useStudySessionStore } from "@shared/model/studySessionStore";
import { AIBrainCommandCenter } from "@shared/ui/AIBrainCommandCenter";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Calculator,
  Check,
  Clock,
  Cpu,
  Heart,
  Menu,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- LAZY LOADING (Performance Boost) ---
const GanttChart = React.lazy(() =>
  import("@widgets/gantt-chart/ui/GanttChart").then((module) => ({
    default: module.GanttChart,
  })),
);
const GraphCalculator = React.lazy(() =>
  import("@features/calculator/GraphCalculator").then((module) => ({
    default: module.GraphCalculator,
  })),
);
const RoosterScanner = React.lazy(() =>
  import("@features/rooster-scanner/ui/RoosterScanner").then((module) => ({
    default: module.RoosterScanner,
  })),
);

// Lazy Chart Widgets
const GaugeChart = React.lazy(() =>
  import("@widgets/charts/ui/GaugeChart").then((module) => ({
    default: module.GaugeChart,
  })),
);
const SubjectRadar = React.lazy(() =>
  import("@widgets/charts/ui/SubjectRadar").then((module) => ({
    default: module.SubjectRadar,
  })),
);

const SUBJECTS = [
  "wiskunde",
  "natuurkunde",
  "scheikunde",
  "frans",
  "engels",
  "nederlands",
  "filosofie",
] as const;

// --- SUB-COMPONENT: LIVE DATE (Anti-Re-render) ---
// Dit voorkomt dat het HELE dashboard elke minuut opnieuw tekent.
const LiveHeaderDate: React.FC<{ lang: string }> = React.memo(({ lang }) => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d: Date) => {
    const dayName = d.toLocaleDateString(lang === "nl" ? "nl-NL" : "en-US", {
      weekday: "long",
    });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString(lang === "nl" ? "nl-NL" : "en-US", {
      month: "long",
    });
    const timeStr = d.toLocaleTimeString(lang === "nl" ? "nl-NL" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (lang === "nl") {
      // Force strict capitalization: Woensdag 7 januari om 22:36 uur
      const day =
        dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();
      const month = monthName.toLowerCase();
      return `${day} ${dayNum} ${month} om ${timeStr} uur`;
    }
    return `${dayName}, ${monthName} ${dayNum} at ${timeStr}`;
  };

  return <p className="ud-date">{formatDate(date)}</p>;
});

// --- ICONS ---
const FranceIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L10 6M12 2L14 6M12 2V6M10 6L9 10M14 6L15 10M10 6H14M9 10L7 16M15 10L17 16M9 10H15M7 16L6 22M17 16L18 22M7 16H17M8 22H16M10 22C10 20 14 20 14 22"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 6V10M12 10V16"
      stroke={color}
      strokeWidth="0.8"
      opacity="0.5"
    />
  </svg>
);

const TranslationIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 10H11M8 10V12M8 10C8 8.5 7.5 7 6 6M10 6C9 7 8 8.5 8 10"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 18l3-7 3 7M15.5 15h3"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 5c1 0 3 1 3 3M4 19c-1 0-3-1-3-3"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.3"
    />
    <path
      d="M13 4c3 0 7 2 7 6M11 20c-3 0-7-2-7-6"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.3"
    />
  </svg>
);

// --- MAIN COMPONENT ---
const UltimateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useTranslations();
  const { settings } = useSettings();
  const { tasks: plannerItems, initialize: fetchPlan } = usePlannerEliteStore();
  const { isTimerActive, timeRemaining, workDuration, getFormattedTime } =
    useStudySessionStore();

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { logFeedback } = useMotivationStore();
  const [currentQuote, setCurrentQuote] = useState<string | null>(null);

  // --- STALE-WHILE-REVALIDATE: Load cache immediately ---
  const [rawGrades, setRawGrades] = useState<ManualGrade[]>([]);
  const [somtodayAverages, setSomtodayAverages] = useState<
    Record<string, number>
  >({});

  // --- TIME-BASED AUTO-REFRESH ---
  // This ensures that deadlines disappear exactly when they pass
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000); // Check every 30s
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initAndFetch = async () => {
      // Refresh Plan (Homework/Tasks)
      fetchPlan();

      try {
        // Fetch Manual Grades
        const grades = await getManualGradesSQL();

        // Filter by Academic Year
        const { startDate } = getCurrentAcademicYearRange();
        const currentGrades = grades.filter((g) => g.date >= startDate);

        setRawGrades(currentGrades);

        // Calculate Averages Locally
        const bySubject: Record<string, { total: number; weight: number }> = {};

        currentGrades.forEach((g) => {
          const normSubj = normalizeSubjectName(g.subject);
          if (!bySubject[normSubj])
            bySubject[normSubj] = { total: 0, weight: 0 };

          const gradeVal =
            typeof g.grade === "string" ? parseFloat(g.grade) : g.grade;
          const weightVal =
            typeof g.weight === "string" ? parseFloat(g.weight) : g.weight;

          if (!isNaN(gradeVal) && !isNaN(weightVal)) {
            bySubject[normSubj].total += gradeVal * weightVal;
            bySubject[normSubj].weight += weightVal;
          }
        });

        const avgs: Record<string, number> = {};
        Object.entries(bySubject).forEach(([subj, data]) => {
          if (data.weight > 0) {
            avgs[subj] = data.total / data.weight;
          }
        });

        setSomtodayAverages(avgs);
      } catch (err) {
        console.error("[Dashboard] Failed to load manual grades:", err);
      }
    };

    // Poll every 5 minutes to keep specific grades fresh if added in another tab
    initAndFetch();
    const interval = setInterval(initAndFetch, 300000);
    return () => clearInterval(interval);
  }, [fetchPlan]);

  const getSubjectGrade = (subject: string): number | null => {
    const key = normalizeSubjectName(subject);
    const avg = somtodayAverages[key];
    return avg !== undefined ? Number(avg.toFixed(1)) : null;
  };

  const nearestDeadlines = useMemo(() => {
    const now = currentTime;
    // CORRECT: Use local date to avoid UTC mismatch at midnight
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Only show actual "deadlines" (Exams, Critical tasks, or Homework)
    // EXCLUDE regular school lessons (type 'lesson')
    const { startDate } = getCurrentAcademicYearRange();

    const upcoming = plannerItems
      .filter((i: EliteTask) => {
        if (i.completed || !i.date || i.type === "lesson") return false;

        // Academic Year Check
        if (i.date < startDate) return false;

        // Only show exams, homework, or critical/high priority
        const isRelevant =
          i.type === "exam" ||
          i.type === "homework" ||
          i.priority === "critical" ||
          i.priority === "high";
        if (!isRelevant) return false;

        // 1. If date is in the absolute past, hidden
        if (i.date < todayStr) return false;

        // --- 2. Time check for today's tasks
        if (i.date === todayStr && i.startTime) {
          const parts = i.startTime.split(":");
          if (parts.length >= 2) {
            const h = Number(parts[0]);
            const m = Number(parts[1]);
            const taskMins = h * 60 + m;
            // If task time has already passed, hide the alert
            if (taskMins <= currentMins) return false;
          }
        }

        // For future dates or today's tasks that haven't passed yet
        return true;
      })
      .sort(
        (a: EliteTask, b: EliteTask) =>
          new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime(),
      );

    return upcoming.slice(0, 3);
  }, [plannerItems, currentTime]);

  const pomoProgress =
    workDuration > 0
      ? ((workDuration * 60 - timeRemaining) / (workDuration * 60)) * 100
      : 0;
  const pomoTimeDisplay = getFormattedTime();

  const SUBJECT_LABELS = useMemo(
    () => [
      "Wiskunde B",
      t.subjects.physics,
      t.subjects.chemistry,
      t.subjects.french,
      t.subjects.english,
      t.subjects.dutch,
      t.subjects.philosophy,
    ],
    [t],
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = settings.profile?.name || "VWO Student";

    let timeGreeting = "Goedenavond";
    if (hour < 12) timeGreeting = "Goedemorgen";
    else if (hour < 18) timeGreeting = "Goedemiddag";

    return { greeting: timeGreeting, name };
  }, [settings.profile?.name]);

  // Data for charts
  const currentGrades = SUBJECTS.map((s) => getSubjectGrade(s) || 0);

  return (
    <div
      className={`ultimate-dashboard-container ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}
    >
      {/* MOBILE TOGGLE BUTTON */}
      <button
        className="ud-mobile-toggle lg:hidden fixed top-4 right-4 z-50 p-2 bg-obsidian-900 border border-white/10 rounded-lg text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* === LEFT SIDEBAR === */}
      <aside
        className={`ud-sidebar ud-sidebar-left ${isMobileMenuOpen ? "mobile-visible" : ""}`}
      >
        <div className="ud-card">
          <div className="ud-card-header">
            <h3>{t.dashboard.pomodoro}</h3>
            <Clock size={16} />
          </div>
          <p>
            Focus:{" "}
            <span className="ud-accent-blue">
              {isTimerActive
                ? t.dashboard.focus_active
                : t.dashboard.focus_paused}
            </span>{" "}
            - {pomoTimeDisplay} / {workDuration} min
          </p>
          <div className="ud-progress-bar-container">
            <div
              className="ud-progress-bar"
              style={{ width: `${pomoProgress}%` }}
            ></div>
          </div>
        </div>

        {/* LAZY LOADED CALCULATOR */}
        <div
          className="ud-card ud-calculator-card cursor-pointer hover:border-purple-500/50 transition-colors"
          onClick={() => navigate("/graph")}
        >
          <div className="ud-card-header">
            <h3>{t.dashboard.calculator_title}</h3>
            <Calculator size={14} />
          </div>
          <Suspense
            fallback={
              <div className="h-[120px] bg-white/5 rounded-lg flex items-center justify-center animate-pulse text-xs text-slate-500">
                Rekenmachine laden...
              </div>
            }
          >
            <GraphCalculator
              initialFunction="0.1*x^3 + 0.2*x^2 - 2*x - 1"
              initialColor="#39ff14"
              isWidget={true}
            />
          </Suspense>
        </div>

        {/* AI BRAIN COMMAND CENTER */}
        <AIBrainCommandCenter className="mb-4" />

        <div className="ud-card">
          <div className="ud-card-header">
            <h3>{t.dashboard.digital_binas}</h3>
            <BookOpen size={16} className="ud-accent-yellow" />
          </div>
          <div className="ud-search-bar" onClick={() => navigate("/formula")}>
            <input
              type="text"
              placeholder={t.dashboard.binas_search}
              readOnly
            />
            <Search size={14} />
          </div>
        </div>
      </aside>

      {/* === CENTER MAIN CONTENT === */}
      <main className="ud-main-content">
        <header className="ud-card ud-main-header">
          {/* RIJ 1: Begroeting */}
          <h1 className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
            <span>{greeting.greeting},</span>
            <span className="text-electric animate-pulse-subtle">
              {greeting.name}
            </span>
          </h1>

          {/* RIJ 2: Datum & Tijd */}
          <LiveHeaderDate lang={lang} />

          {/* RIJ 3: Eventuele alerts (max 3) */}
          {nearestDeadlines.length > 0 && (
            <div className="ud-alerts-row">
              {nearestDeadlines.map((deadline: EliteTask) => (
                <div key={deadline.id} className="ud-deadline-alert">
                  <AlertTriangle size={16} />
                  <span>Deadline: {deadline.title}</span>
                </div>
              ))}
            </div>
          )}
        </header>

        <section className="ud-card ud-gantt-section">
          <Suspense
            fallback={
              <div className="h-[200px] flex items-center justify-center text-slate-500 animate-pulse text-xs">
                Gantt Chart laden...
              </div>
            }
          >
            <GanttChart />
          </Suspense>
        </section>

        <div className="mt-0 grid grid-cols-3 gap-4">
          {/* 1. Deep Work Mode */}
          {/* 1. Deep Work Mode (Amber Neon) */}
          <button
            className="group relative flex flex-col items-center justify-center gap-2 px-4 py-6 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 h-full"
            onClick={() => navigate("/blurting-mode")}
          >
            <Brain
              size={28}
              strokeWidth={1.5}
              className="text-amber-400 group-hover:text-amber-300 group-hover:rotate-12 transition-all duration-500"
            />
            <span className="text-amber-400/90 group-hover:text-amber-300 font-bold tracking-wider text-xs uppercase text-center drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
              Deep Work
            </span>
          </button>

          {/* 2. Motivatie (Violet Neon) */}
          <button
            className="group relative flex flex-col items-center justify-center gap-2 px-4 py-6 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/20 hover:border-violet-500/50 rounded-2xl shadow-[0_0_15px_rgba(139,92,246,0.05)] hover:shadow-[0_0_25px_rgba(139,92,246,0.15)] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 h-full"
            onClick={() => {
              const quotes = t("planner:motivation.quotes", {
                returnObjects: true,
              }) as unknown as string[];
              const randomQuote = Array.isArray(quotes)
                ? quotes[Math.floor(Math.random() * quotes.length)]
                : MOTIVATIONAL_QUOTES[
                Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
                ];
              setCurrentQuote(randomQuote || null);
              setTimeout(() => setCurrentQuote(null), 10000);
            }}
          >
            {/* Custom Masked Icon to ensure color match */}
            <div
              className="w-10 h-10 bg-violet-400 group-hover:bg-violet-300 transition-all duration-500 group-hover:animate-pulse"
              style={{
                maskImage: 'url("./motivationicon.png")',
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskImage: 'url("./motivationicon.png")',
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
            />
            <span className="text-violet-400/90 group-hover:text-violet-300 font-bold tracking-wider text-xs uppercase text-center drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]">
              Motivatie
            </span>
          </button>

          {/* 3. Analytics (Sapphire/Sky Blue Neon) */}
          <button
            className="group relative flex flex-col items-center justify-center gap-2 px-4 py-6 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/50 rounded-2xl shadow-[0_0_15px_rgba(14,165,233,0.05)] hover:shadow-[0_0_25px_rgba(14,165,233,0.15)] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 h-full"
            onClick={() => navigate("/analytics")}
          >
            <BarChart3
              size={28}
              strokeWidth={1.5}
              className="text-sky-400 group-hover:text-sky-300 group-hover:rotate-12 transition-all duration-500"
            />
            <span className="text-sky-400/90 group-hover:text-sky-300 font-bold tracking-wider text-xs uppercase text-center drop-shadow-[0_0_8px_rgba(14,165,233,0.4)]">
              Analytics
            </span>
          </button>
        </div>

        {/* Motivation Toast Overlay (Central) */}
        {currentQuote && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
            <div className="bg-zinc-950/90 backdrop-blur-xl border border-purple-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.2)] max-w-lg text-center pointer-events-auto animate-in zoom-in-95 fade-in duration-300 space-y-6">
              <Sparkles
                size={32}
                className="mx-auto text-purple-400 animate-pulse"
              />
              <p className="text-xl md:text-2xl text-white font-medium leading-relaxed italic">
                "{currentQuote}"
              </p>

              <div className="flex justify-center gap-6 pt-2">
                <button
                  onClick={() => {
                    logFeedback(currentQuote, "like");
                    setCurrentQuote(null);
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-3 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/30 text-emerald-400 transition-colors border border-emerald-500/30">
                    <Check size={20} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] text-emerald-500/50 uppercase font-bold tracking-wider">
                    Inspireert
                  </span>
                </button>

                <button
                  onClick={() => {
                    logFeedback(currentQuote, "dislike");
                    setCurrentQuote(null);
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-3 rounded-full bg-red-500/20 group-hover:bg-red-500/30 text-red-400 transition-colors border border-red-500/30">
                    <X size={20} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] text-red-500/50 uppercase font-bold tracking-wider">
                    Verberg
                  </span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-purple-500/50 animate-[width_10s_linear_forwards] w-full origin-left rounded-b-2xl" />
            </div>
          </div>
        )}
      </main>

      {/* === RIGHT SIDEBAR === */}
      <aside
        className={`ud-sidebar ud-sidebar-right ${isMobileMenuOpen ? "mobile-visible" : ""}`}
      >
        <div className="ud-card">
          <div className="ud-card-header">
            <h3>{t.dashboard.subject_shortcuts}</h3>
          </div>
          <div className="ud-links-grid">
            <div
              className="ud-link-item blue"
              onClick={() => navigate("/library?subject=Wiskunde B")}
            >
              <span>
                <Zap size={20} />
              </span>
              {t.subjects.math}
            </div>
            <div
              className="ud-link-item red"
              onClick={() => navigate("/library?subject=Natuurkunde")}
            >
              <span>
                <BookOpen size={20} />
              </span>
              {t.subjects.physics}
            </div>
            <div
              className="ud-link-item yellow"
              onClick={() => navigate("/library?subject=Scheikunde")}
            >
              <span>
                <Search size={20} />
              </span>
              {t.subjects.chemistry}
            </div>
            <div
              className="ud-link-item orange"
              onClick={() => navigate("/library?subject=Frans")}
            >
              <span>
                <FranceIcon size={20} color="#f97316" />
              </span>
              {t.subjects.french}
            </div>
            <div
              className="ud-link-item purple"
              onClick={() => navigate("/library?subject=Engels")}
            >
              <span>
                <TranslationIcon size={20} color="#a855f7" />
              </span>
              {t.subjects.english}
            </div>
            <div
              className="ud-link-item cyan"
              onClick={() => navigate("/library?subject=Nederlands")}
            >
              <span>
                <BookOpen size={20} className="text-cyan-400" />
              </span>
              {t.subjects.dutch}
            </div>
            <div
              className="ud-link-item pink"
              onClick={() => navigate("/library?subject=Filosofie")}
            >
              <span>
                <Brain size={20} />
              </span>
              {t.subjects.philosophy}
            </div>
            <div
              className="ud-link-item rose"
              onClick={() => navigate("/library?subject=Psychologie")}
            >
              <span>
                <Heart size={20} />
              </span>
              {t.subjects.psychology}
            </div>
            <div
              className="ud-link-item green"
              onClick={() => navigate("/library?subject=Informatica")}
            >
              <span>
                <Cpu size={20} />
              </span>
              {t.subjects.it}
            </div>
          </div>
        </div>

        <div className="ud-card ud-radar-card">
          <div className="ud-card-header">
            <h3>{t.dashboard.grade_radar}</h3>
            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 ml-2">
              LIVE
            </span>
          </div>
          <div className="ud-chart-container-medium">
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Radar laden...
                </div>
              }
            >
              <SubjectRadar
                subjects={SUBJECTS}
                labels={SUBJECT_LABELS}
                grades={currentGrades}
                goalAverage={settings.goals?.average}
                rawGrades={rawGrades}
                t={t}
              />
            </Suspense>
          </div>
        </div>

        <div className="ud-card">
          <div className="ud-card-header">
            <h3>{t.dashboard.subject_mastery}</h3>
          </div>
          <div className="ud-gauges-grid-3">
            {SUBJECTS.map((subject, idx) => (
              <Suspense
                key={subject}
                fallback={
                  <div className="w-16 h-16 rounded-full bg-white/5 animate-pulse" />
                }
              >
                <GaugeChart
                  value={(getSubjectGrade(subject) || 0) * 10} // Display as % for gauge
                  label={SUBJECT_LABELS[idx]}
                />
              </Suspense>
            ))}
          </div>
        </div>
      </aside>
      {isScannerOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] text-white">
              Scanner laden...
            </div>
          }
        >
          <RoosterScanner
            onClose={() => setIsScannerOpen(false)}
            onScheduleDetected={(events) => {
              console.log("Imported:", events);
              setIsScannerOpen(false);
              // In real app: Add to store
              alert(`Succesvol ${events.length} lessen geïmporteerd!`);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default UltimateDashboard;
