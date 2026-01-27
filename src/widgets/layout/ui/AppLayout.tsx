import { checkProvidersHealth } from "@shared/api/aiCascadeService";
import { notificationService } from "@shared/api/audio/notificationSounds";
import { useMediaQuery } from "@shared/hooks/useMediaQuery";
import { useSettings } from "@shared/hooks/useSettings";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useNavigationStore } from "@shared/model/navigationStore";
import { useStudySessionStore } from "@shared/model/studySessionStore";
import { AIStatusBanner } from "@shared/ui/AIStatusBanner";
import { LanguageSwitcher } from "@shared/ui/LanguageSwitcher";
import { OfflineIndicator } from "@shared/ui/OfflineIndicator";
import { ReloadPrompt } from "@shared/ui/ReloadPrompt";
import { Menu, Timer, X } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { AIStatusBar } from "../../ai-status/AIStatusBar";
import { MobileMenu } from "./MobileMenu";
import { Sidebar } from "./Sidebar";
import { WindowControls } from "./WindowControls";

// Lazy loaded components

const DebugPanel = React.lazy(() =>
  import("@features/debugger/ui/DebugPanel").then((m) => ({
    default: m.DebugPanel,
  })),
);
const AchievementToast = React.lazy(() =>
  import("@features/gamification/ui/AchievementToast").then((m) => ({
    default: m.AchievementToast,
  })),
);
const WeatherWidget = React.lazy(() =>
  import("@shared/ui/WeatherWidget").then((m) => ({
    default: m.WeatherWidget,
  })),
);


const TutorInterface = React.lazy(() =>
  import("@features/tutor/ui/TutorInterface").then((m) => ({
    default: m.TutorInterface,
  })),
);

/**
 * Main application layout with header, sidebar, and content area
 * Used as the root layout for all routes
 */
export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, updateSettings } = useSettings();
  const { t, lang } = useTranslations();

  // Responsive
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Determine if we are in an immersive lab mode (no padding, full width)
  const isImmersive = [
    "/physics",
    "/chemistry",
    "/biology",
    "/3d-studio",
    "/math-modern",
    "/philosophy",
    "/psychology",
    "/language",
    "/code",
    "/ailab",
    "/examen-centrum",
    "/settings",
    "/library",
    "/lesson",
  ].some((path) => location.pathname.startsWith(path));

  // Navigation Store
  const {
    sidebarOpen,
    toggleSidebar,
    mobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    setLanguage: setStoreLang,
  } = useNavigationStore();

  // Study Session Store (Timer)
  const {
    isTimerActive: timerActive,
    timeRemaining: _timeLeft,
    startTimer,
    pauseTimer,
    getFormattedTime,
    setWorkDuration,
    tick,
    sessionType,
  } = useStudySessionStore();

  // Close mobile menu on desktop
  useEffect(() => {
    if (isDesktop && closeMobileMenu) {
      closeMobileMenu();
    } else if (isDesktop && !closeMobileMenu) {
      console.error(
        "NavigationStore: closeMobileMenu is missing!",
        useNavigationStore.getState(),
      );
    }
  }, [isDesktop, closeMobileMenu]);

  // Check AI health on mount - keep the warning but silence the console logs internally
  useEffect(() => {
    checkProvidersHealth().then((status) => {
      if (!status.groq && !status.huggingface && !status.gemini) {
        // Keep UI warning but it won't spam console logs now
      }
    });
  }, []);

  // Global Audio Unlocker
  useEffect(() => {
    const unlockAudio = async () => {
      try {
        const Tone = await import("tone");
        if (Tone.context.state !== "running") {
          await Tone.start();
        }
      } catch (e) {
        console.warn("[Audio] Failed to unlock context:", e);
      }
    };

    const handleInteraction = () => {
      unlockAudio();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  // Timer Interval Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, tick]);

  // Sound Trigger Logic
  const previousSessionType = useRef(sessionType);
  useEffect(() => {
    if (previousSessionType.current !== sessionType) {
      if (sessionType === "work") {
        notificationService.play(settings?.timerStartSound || "zen-bell");
      } else {
        notificationService.play(settings?.timerBreakSound || "success-chord");
      }
      previousSessionType.current = sessionType;
    }
  }, [sessionType, settings]);

  // Sync timer with settings
  useEffect(() => {
    if (!timerActive && settings?.pomodoroWork) {
      setWorkDuration(settings.pomodoroWork);
    }
  }, [settings?.pomodoroWork, timerActive, setWorkDuration]);

  const toggleTimer = () => {
    if (timerActive) pauseTimer();
    else startTimer();
  };

  return (
    <div className="flex h-full bg-[#0d1117] text-white font-outfit overflow-hidden">
      {/* Dynamic Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-electric/5 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Offline Status Indicator */}
      <OfflineIndicator />


      {/* Header */}
      <header
        className="glass border-b border-white/10 h-16 fixed top-0 left-0 right-0 z-[9999] backdrop-blur-xl bg-obsidian-950/95 drag-region"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, width: '100%', zIndex: 9999 }}
      >
        <div className="w-full px-6 h-16 flex items-center justify-between relative">
          {/* Left: Logo + Window Controls */}
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-3 cursor-pointer group no-drag"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(41,98,255,0.4)]">
                <img
                  src="./android-chrome-512x512.png"
                  className="w-full h-full object-contain p-1"
                  alt="Elite Logo"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-white leading-none">
                  VWO
                  <span className="text-[#2962ff] drop-shadow-[0_0_8px_rgba(41,98,255,0.3)]">
                    ELITE
                  </span>
                </span>
              </div>
            </div>

            <div className="no-drag">
              <WindowControls />
            </div>
          </div>

          {/* Center: Timer & Status (Absolute Centered relative to Main Content) */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-6 no-drag transition-[left] duration-300 ease-in-out"
            style={{
              left: isDesktop
                ? `calc(50% - ${(sidebarOpen ? 208 : 56) / 2}px)`
                : "50%",
            }}
          >
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl group hover:border-gold/30 transition-all">
              <Timer
                size={16}
                className={`${timerActive ? "text-gold animate-pulse" : "text-slate-500"}`}
              />
              <span
                className={`font-mono font-bold text-sm ${timerActive ? "text-gold" : "text-slate-400"}`}
              >
                {getFormattedTime()}
              </span>
              <div className="h-4 w-[1px] bg-white/10 mx-1" />
              <button
                onClick={toggleTimer}
                className="text-[10px] uppercase font-bold text-slate-500 hover:text-white transition-colors"
              >
                {timerActive ? "Pause" : "Start"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 no-drag">
            <button
              className="md:hidden text-slate-400 hover:text-white"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="hidden sm:block">
              <LanguageSwitcher
                currentLang={lang}
                onLanguageChange={(newLang) => {
                  setStoreLang(newLang);
                  updateSettings({ language: newLang });
                }}
              />
            </div>

            <React.Suspense fallback={<div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />}>
              <WeatherWidget />
            </React.Suspense>

            <button
              onClick={() => navigate("/settings")}
              className="no-ai-capture w-10 h-10 rounded-xl bg-slate-800 border-2 border-slate-700/50 hidden sm:flex items-center justify-center hover:border-electric transition-all duration-300 cursor-pointer overflow-hidden shadow-lg group"
            >
              <img
                src={settings.profile?.avatar?.replace(/^\//, './') || "./profilepic.jpg"}
                alt="Profile"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
            </button>


          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {
        !isDesktop && mobileMenuOpen && (
          <MobileMenu onClose={closeMobileMenu} t={t} />
        )
      }

      {/* Main Layout Body */}
      <div
        className={`relative z-10 flex w-full pt-16 ${isImmersive ? "h-screen overflow-hidden" : "min-h-[calc(100vh-4rem)]"}`}
      >
        {/* Sidebar Logic */}
        {isDesktop && (
          <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} t={t} />
        )}

        {/* Content Container */}
        <main
          className={`flex-1 min-w-0 transition-all duration-500 w-full flex flex-col
            ${isImmersive ? "p-0" : "px-8 py-8 max-w-[1920px] mx-auto"}`}
        >
          {!isImmersive && (
            <AIStatusBanner
              onNavigateToSettings={() => navigate("/settings")}
            />
          )}

          <div
            className={`flex-1 animate-fade-in ${isImmersive ? "h-full flex flex-col" : ""}`}
          >
            <Outlet context={{ t, lang, navigate }} />
          </div>
        </main>

        {/* Sidebar Spacer */}
        {isDesktop && (
          <div
            className="transition-all duration-500 shrink-0 border-l border-white/5 bg-zinc-950/20"
            style={{ width: sidebarOpen ? "208px" : "56px" }}
          />
        )}
      </div>

      {/* Floating Elements */}
      <React.Suspense fallback={null}>
        <DebugPanel />
        <TutorInterface />
        <AchievementToast />
      </React.Suspense>

      <ReloadPrompt />
      <AIStatusBar />
    </div >
  );
};
