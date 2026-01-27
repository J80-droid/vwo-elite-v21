/* eslint-disable @typescript-eslint/no-explicit-any -- Translation functions and module themes */
import "./modules"; // CRITICAL: Register all modules

import { useTranslations } from "@shared/hooks/useTranslations";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import { LabSidebar } from "@shared/ui/LabSidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAllModules } from "../api/registry";

const NAV_CATEGORIES = [
  {
    id: "overzicht",
    label: (t: any) => t("planner.categories.overview", "Overzicht"),
    modules: ["calendar", "grades", "analytics", "timeline"],
  },
  {
    id: "academisch",
    label: (t: any) => t("planner.categories.academic", "Academisch"),
    modules: ["homework", "exams", "pws", "tasks"],
  },
  {
    id: "beheer",
    label: (t: any) => t("planner.categories.management", "Beheer"),
    modules: ["settings"],
  },
];

const MODULE_THEMES: Record<string, any> = {
  calendar: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    text: "text-violet-400",
    shadow: "shadow-[0_0_15px_rgba(139,92,246,0.1)]",
    icon: "text-violet-400",
    glow: "from-violet-500/20 to-purple-600/5",
  },
  timeline: {
    border: "border-fuchsia-500/30",
    bg: "bg-fuchsia-500/5",
    text: "text-fuchsia-400",
    shadow: "shadow-[0_0_15px_rgba(232,121,249,0.1)]",
    icon: "text-fuchsia-400",
    glow: "from-fuchsia-500/20 to-pink-600/5",
  },
  homework: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    icon: "text-emerald-400",
    glow: "from-emerald-500/20 to-teal-600/5",
  },
  exams: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    text: "text-rose-400",
    shadow: "shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    icon: "text-rose-400",
    glow: "from-rose-500/20 to-orange-600/5",
  },
  pws: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    shadow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    icon: "text-amber-400",
    glow: "from-amber-500/20 to-yellow-600/5",
  },
  tasks: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    text: "text-cyan-400",
    shadow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
    icon: "text-cyan-400",
    glow: "from-cyan-500/20 to-blue-600/5",
  },
  analytics: {
    border: "border-teal-500/30",
    bg: "bg-teal-500/5",
    text: "text-teal-400",
    shadow: "shadow-[0_0_15px_rgba(20,184,166,0.1)]",
    icon: "text-teal-400",
    glow: "from-teal-500/20 to-emerald-600/5",
  },
  settings: {
    border: "border-slate-500/30",
    bg: "bg-slate-500/5",
    text: "text-slate-400",
    shadow: "shadow-[0_0_15px_rgba(148,163,184,0.1)]",
    icon: "text-slate-400",
    glow: "from-slate-500/20 to-gray-600/5",
  },
  grades: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    icon: "text-emerald-400",
    glow: "from-emerald-500/20 to-teal-600/5",
  },
};

const DEFAULT_THEME = {
  border: "border-indigo-500/30",
  bg: "bg-indigo-500/5",
  text: "text-indigo-400",
  shadow: "shadow-[0_0_15px_rgba(99,102,241,0.1)]",
  icon: "text-indigo-400",
  glow: "from-indigo-500/20 to-blue-600/5",
};

interface PlannerLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const PlannerLayout: React.FC<PlannerLayoutProps> = ({
  children,
  sidebar,
}) => {
  const activeModule = usePlannerEliteStore((state) => state.activeModule);
  const setActiveModule = usePlannerEliteStore(
    (state) => state.setActiveModule,
  );
  const { initialize } = usePlannerEliteStore();
  const [isModulesCollapsed, setModulesCollapsed] = useState(false);
  const [isInfoSidebarCollapsed, setInfoSidebarCollapsed] = useState(false);

  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync URL -> Store
  useEffect(() => {
    if (tab) {
      setActiveModule(tab as any);
    } else {
      // Default redirects to calendar if no tab provided
      navigate("/planner/calendar", { replace: true });
    }
  }, [tab, setActiveModule, navigate]);

  // Configuration for Tabs
  const { t } = useTranslations();
  const modules = getAllModules();

  return (
    <div
      className="h-full bg-black font-outfit z-0 flex overflow-hidden select-none transition-all duration-300"
    >
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      {/* 1. LEFT SIDEBAR: MODULE NAVIGATION (Standardized) */}
      <LabSidebar
        activeModule={activeModule}
        onSelect={(id) => navigate(`/planner/${id}`)}
        isCollapsed={isModulesCollapsed}
        onToggle={() => setModulesCollapsed(!isModulesCollapsed)}
        t={t}
        modules={modules as any}
        categories={NAV_CATEGORIES}
        themes={MODULE_THEMES}
        defaultTheme={DEFAULT_THEME}
        labTitle={t("planner:dashboard.layout.elite_planner")}
        footerProtocol={t("planner:dashboard.layout.elite_planner")}
      />

      {/* 2. MAIN STAGE */}
      <div className="flex-1 relative flex items-stretch overflow-hidden min-w-0">
        <div
          id="planner-stage"
          className="flex-1 relative z-0 bg-gradient-to-b from-obsidian-950 to-black transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar"
        >
          {children}
        </div>

        {/* 3. RIGHT SIDEBAR: INFOPANEL (Existing) */}
        {sidebar && (
          <div
            className={`
                            h-full bg-obsidian-950/40 backdrop-blur-2xl border-l border-white/5
                            transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shrink-0 relative flex flex-col
                            ${isInfoSidebarCollapsed ? "w-14" : "w-80"}
                        `}
          >
            {/* Header with Toggle (Matches LabSidebar style) */}
            <div
              className={`flex items-center p-4 border-b border-white/5 bg-white/[0.02] ${isInfoSidebarCollapsed ? "justify-center h-14" : "justify-between"}`}
            >
              {!isInfoSidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">
                    {t("planner:dashboard.layout.stats_actions")}
                  </span>
                  <span className="text-[8px] font-bold text-indigo-400/50 uppercase tracking-widest leading-none mt-1">
                    {t("planner:dashboard.layout.sync_active")}
                  </span>
                </div>
              )}
              <button
                onClick={() => setInfoSidebarCollapsed(!isInfoSidebarCollapsed)}
                className={`p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-all ${isInfoSidebarCollapsed ? "hover:scale-110" : ""}`}
                title={
                  isInfoSidebarCollapsed
                    ? t("planner:dashboard.layout.show_details")
                    : t("planner:dashboard.layout.hide_details")
                }
              >
                {isInfoSidebarCollapsed ? (
                  <ChevronLeft size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            </div>

            {/* Inner Content - Hidden when collapsed */}
            <div
              className={`flex-1 w-80 overflow-y-auto custom-scrollbar p-6 relative z-10 transition-all duration-300 ${isInfoSidebarCollapsed ? "opacity-0 pointer-events-none translate-x-10" : "opacity-100 translate-x-0"}`}
            >
              {/* Radial Glow for Sidebar */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none" />

              {sidebar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
