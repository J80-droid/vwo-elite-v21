import "./modules"; // Register modules

import { useTranslations } from "@shared/hooks/useTranslations";
import { LabModule, LabNavCategory, LabSidebar } from "@shared/ui/LabSidebar";
import { Brain } from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAllModules, getModuleConfig } from "../api/registry";

// --- LAZY MODULE COMPONENTS ---
const MODULE_COMPONENTS: Record<
  string,
  {
    Stage: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
    Sidebar?: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  }
> = {
  cognition: {
    Stage: React.lazy(() => import("./modules/cognition/CognitionStage").then(m => ({ default: m.CognitionStage }))),
    Sidebar: React.lazy(() => import("./modules/cognition/CognitionSidebar").then(m => ({ default: m.CognitionSidebar }))),
  },
  social: {
    Stage: React.lazy(() => import("./modules/social/SocialStage")),
  },
  personality: {
    Stage: React.lazy(() => import("./modules/personality/PersonalityStage")),
  },
};
import {
  PsychologyLabProvider,
  usePsychologyLabContext,
} from "../hooks/PsychologyLabContext";
import { PsychologyHub } from "./PsychologyHub";

// Standard Lab Themes
const MODULE_THEMES = {
  cognition: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    icon: "text-amber-400",
    accent: "bg-amber-500",
    shadow: "shadow-[0_0_30px_rgba(245,158,11,0.1)]",
    color: "amber",
    glow: "from-amber-500/20 to-orange-600/5",
  },
  social: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    text: "text-rose-400",
    icon: "text-rose-400",
    accent: "bg-rose-500",
    shadow: "shadow-[0_0_30px_rgba(244,63,94,0.1)]",
    color: "rose",
    glow: "from-rose-500/20 to-pink-600/5",
  },
  personality: {
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/5",
    text: "text-indigo-400",
    icon: "text-indigo-400",
    accent: "bg-indigo-500",
    shadow: "shadow-[0_0_30px_rgba(99,102,241,0.1)]",
    color: "indigo",
    glow: "from-indigo-500/20 to-violet-600/5",
  },
};

const DEFAULT_THEME = {
  border: "border-slate-500/30",
  bg: "bg-slate-500/5",
  text: "text-slate-400",
  shadow: "shadow-[0_0_15px_rgba(148,163,184,0.1)]",
  icon: "text-slate-400",
  glow: "from-slate-500/20 to-gray-600/5",
};

const NAV_CATEGORIES: LabNavCategory[] = [
  {
    id: "domains",
    label: (t: (key: string, def?: string) => string) =>
      t("psychology.categories.domains", "Domeinen"),
    modules: ["cognition", "social", "personality"],
  },
];

const PsychologyLabLayoutInner: React.FC = () => {
  const { setActiveModule } = usePsychologyLabContext();
  const { module: activeModule } = useParams();
  const navigate = useNavigate();
  const modules = getAllModules();
  const { t } = useTranslations();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Derived state
  const isValidModule =
    activeModule && modules.some((m) => m.id === activeModule);
  const activeConfig = isValidModule ? getModuleConfig(activeModule) : null;

  useEffect(() => {
    if (activeModule) {
      setActiveModule(activeModule);
    } else {
      setActiveModule("");
    }
  }, [activeModule, setActiveModule]);

  // Map to LabSidebar format
  const sidebarModules: LabModule[] = modules.map((m) => ({
    id: m.id,
    icon: m.icon,
    label: (t) => m.label(t),
  }));

  // HUB VIEW
  if (!activeConfig) {
    return (
      <div className="flex flex-col h-screen bg-black overflow-hidden relative font-outfit text-white">
        {/* Standard Header */}
        <div className="sticky top-0 h-16 border-b border-white/10 bg-black/60 backdrop-blur-xl flex items-center px-6 justify-between z-50 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mr-4"
            >
              <Brain
                className="text-amber-500/80 group-hover:scale-110 transition-transform"
                size={20}
              />
              <span className="font-bold text-lg bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent uppercase tracking-tight">
                {t("psychology.title", "Psychologie Lab")}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 uppercase tracking-widest leading-none">
              VWO ELITE
            </div>
          </div>
        </div>

        <div className="flex-1 flex min-h-0 relative items-stretch overflow-hidden">
          {/* No Sidebar on Hub */}
          <div className="flex-1 relative flex flex-col min-h-0 bg-transparent h-full z-0">
            <PsychologyHub />
          </div>
        </div>
      </div>
    );
  }

  // MODULE VIEW
  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden relative font-outfit text-white">
      {/* TOP HEADER (Standardized) */}
      <div className="sticky top-0 h-16 border-b border-white/10 bg-black/60 backdrop-blur-xl flex items-center px-6 justify-between z-50 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/psychology")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mr-4"
          >
            <Brain
              className="text-amber-500/80 group-hover:scale-110 transition-transform"
              size={20}
            />
            <span className="font-bold text-lg bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent uppercase tracking-tight">
              {t("psychology.title", "Psychologie Lab")}
            </span>
          </button>

          <div className="h-4 w-px bg-white/10 mx-2" />

          <div className="flex items-center gap-2">
            {activeConfig && (
              <>
                <activeConfig.icon
                  size={16}
                  className={`text-${activeConfig.color}-400`}
                />
                <span className="text-sm font-bold uppercase tracking-widest text-slate-300">
                  {activeConfig.label(t)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 uppercase tracking-widest leading-none">
            VWO ELITE
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative items-stretch overflow-hidden">
        {/* 1. LEFT SIDEBAR (Standard LabSidebar) */}
        <LabSidebar
          activeModule={activeModule || ""}
          onSelect={(id) => navigate(`/psychology/${id}`)}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
          t={t}
          modules={sidebarModules}
          categories={NAV_CATEGORIES}
          themes={MODULE_THEMES}
          defaultTheme={DEFAULT_THEME}
          labTitle="Psychology Lab"
          onBack={() => navigate("/psychology")}
        />

        {/* 2. MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
          {/* Background Noise */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0 mix-blend-overlay"></div>

          {/* Controls Sidebar (Use component from config) */}
          {activeModule && MODULE_COMPONENTS[activeModule]?.Sidebar && (
            <div className="w-full md:w-80 border-r border-white/5 bg-black/20 backdrop-blur-sm flex flex-col z-10 h-full relative">
              <Suspense
                fallback={
                  <div className="p-8 text-slate-500">Loading Controls...</div>
                }
              >
                {(() => {
                  const Sidebar = MODULE_COMPONENTS[activeModule].Sidebar!;
                  return <Sidebar />;
                })()}
              </Suspense>
            </div>
          )}

          {/* Stage */}
          <div className="flex-1 relative flex flex-col min-h-0 bg-transparent h-full">
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  Loading Stage...
                </div>
              }
            >
              {activeModule && MODULE_COMPONENTS[activeModule]?.Stage ? (
                (() => {
                  const Stage = MODULE_COMPONENTS[activeModule].Stage;
                  return <Stage />;
                })()
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  Select a module to begin
                </div>
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PsychologyLabLayout = () => (
  <PsychologyLabProvider>
    <PsychologyLabLayoutInner />
  </PsychologyLabProvider>
);
