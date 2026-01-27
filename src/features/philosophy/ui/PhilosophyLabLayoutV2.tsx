/* eslint-disable @typescript-eslint/no-explicit-any */

// import './modules'; // Register modules - Should be handled in registry or init

import { useTranslations } from "@shared/hooks/useTranslations";
import { LabNavCategory, LabSidebar } from "@shared/ui/LabSidebar";
import { AnimatePresence, motion } from "framer-motion";
import React, { Suspense, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAllModules } from "../api/registry";
import {
  PhilosophyLabProvider,
  usePhilosophyLabContext,
} from "../hooks/PhilosophyLabContext";
import { MODULE_THEMES } from "../types/themes";
import { PhilosophyHub } from "./PhilosophyHub";

// Placeholder for sequential processingies for the sidebar
// Categories for the sidebar
const NAV_CATEGORIES: LabNavCategory[] = [
  {
    id: "core",
    label: (t: any) => t("philosophy.categories.core", "Kernmethodes"),
    modules: ["dialogue", "logic", "ethics", "concept-matrix"],
  },
  {
    id: "themes",
    label: (t: any) => t("philosophy.categories.themes", "Thema's"),
    modules: ["techno-human", "science", "society", "battle"],
  },
  {
    id: "tools",
    label: (t: any) => t("philosophy.categories.tools", "Analyse & Examen"),
    modules: ["analysis", "exam"],
  },
];

const DEFAULT_THEME = {
  border: "border-slate-500/30",
  bg: "bg-slate-500/5",
  text: "text-slate-400",
  shadow: "shadow-[0_0_15px_rgba(148,163,184,0.1)]",
  icon: "text-slate-400",
  glow: "from-slate-500/20 to-gray-600/5",
};

// --- LAZY MODULE COMPONENTS ---
const MODULE_COMPONENTS: Record<
  string,
  {
    Stage: React.LazyExoticComponent<any>;
    Sidebar?: React.LazyExoticComponent<any>;
  }
> = {
  dialogue: {
    Stage: React.lazy(() => import("./modules/dialogue/DialogueStage").then(m => ({ default: m.DialogueStage }))),
    Sidebar: React.lazy(() => import("./modules/dialogue/DialogueSidebar").then(m => ({ default: m.DialogueSidebar }))),
  },
  logic: {
    Stage: React.lazy(() => import("./modules/logic/index").then(m => ({ default: (m as any).LogicStage }))),
    Sidebar: React.lazy(() => import("./modules/logic/index").then(m => ({ default: (m as any).LogicSidebar }))),
  },
  ethics: {
    Stage: React.lazy(() => import("./modules/ethics/index").then(m => ({ default: (m as any).EthicsLab }))),
    Sidebar: React.lazy(() => import("./modules/ethics/index").then(m => ({ default: (m as any).EthicsSidebar }))),
  },
  "concept-matrix": {
    Stage: React.lazy(() => import("./modules/concept-matrix/index").then(m => ({ default: (m as any).ConceptMatrixLab }))),
    Sidebar: React.lazy(() => import("./modules/concept-matrix/index").then(m => ({ default: (m as any).ConceptMatrixSidebar }))),
  },
  "techno-human": {
    Stage: React.lazy(() => import("./modules/techno-human/index").then(m => ({ default: (m as any).TechnoLab }))),
    Sidebar: React.lazy(() => import("./modules/techno-human/index").then(m => ({ default: (m as any).TechnoSidebar }))),
  },
  science: {
    Stage: React.lazy(() => import("./modules/science/index").then(m => ({ default: (m as any).ScienceLab }))),
    Sidebar: React.lazy(() => import("./modules/science/index").then(m => ({ default: (m as any).ScienceSidebar }))),
  },
  society: {
    Stage: React.lazy(() => import("./modules/society/index").then(m => ({ default: (m as any).SocietyLab }))),
    Sidebar: React.lazy(() => import("./modules/society/index").then(m => ({ default: (m as any).SocietySidebar }))),
  },
  battle: {
    Stage: React.lazy(() => import("./modules/battle/index").then(m => ({ default: (m as any).BattleLab }))),
    Sidebar: React.lazy(() => import("./modules/battle/index").then(m => ({ default: (m as any).BattleSidebar }))),
  },
  analysis: {
    Stage: React.lazy(() => import("./modules/analysis/index").then(m => ({ default: (m as any).AnalysisLab }))),
    Sidebar: React.lazy(() => import("./modules/analysis/index").then(m => ({ default: (m as any).AnalysisSidebar }))),
  },
  exam: {
    Stage: React.lazy(() => import("./modules/exam/index").then(m => ({ default: (m as any).ExamTrainer }))),
    Sidebar: React.lazy(() => import("./modules/exam/index").then(m => ({ default: (m as any).ExamSidebar }))),
  },
};

const PhilosophyLabLayoutInner: React.FC = () => {
  const { setActiveModule } = usePhilosophyLabContext();
  const { module: activeModule } = useParams();
  const navigate = useNavigate();
  const modules = getAllModules();
  const { t } = useTranslations();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Derived state



  useEffect(() => {
    if (activeModule) {
      setActiveModule(activeModule);
    }
  }, [activeModule, setActiveModule]);

  const handleModuleSelect = (moduleId: string) => {
    navigate(`/philosophy/${moduleId}`);
  };

  if (!activeModule) {
    return <PhilosophyHub />;
  }

  return (
    <div
      className="flex h-full bg-black font-outfit transition-all duration-300 z-0" // Modified className
    >{/* 0. CINEMATIC ATMOSPHERE LAYERS */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Primary Ambient Glow */}
        <div
          className={`absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-30 bg-gradient-to-br from-violet-600/30 to-transparent animate-pulse`}
        />

        {/* Secondary Theme Glow (Dynamic) */}
        <motion.div
          initial={false}
          animate={{
            backgroundColor:
              activeModule === "dialogue"
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(71, 85, 105, 0.1)",
          }}
          className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[150px] transition-colors duration-1000"
        />

        {/* Bottom Shadowing */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent opacity-60" />

        {/* Digital Grain Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>



      <div className="flex-1 flex min-h-0 relative items-stretch overflow-hidden z-10">
        {/* 1. MODULES SIDEBAR (Standardized LabSidebar) */}
        <LabSidebar
          activeModule={activeModule}
          onSelect={handleModuleSelect}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
          t={t}
          modules={modules as any}
          categories={NAV_CATEGORIES}
          themes={MODULE_THEMES as any}
          defaultTheme={DEFAULT_THEME}
          labTitle="Philosophy Mod"
        />

        {/* 2. MAIN CONTENT AREA (Flex Row for Controls + Stage) */}
        <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden bg-black/10 backdrop-blur-sm">
          {/* Controls Sidebar (If 'dialogue' or configured) */}
          {activeModule && MODULE_COMPONENTS[activeModule]?.Sidebar && (
            <div
              className={`w-80 shrink-0 border-r border-white/[0.05] bg-black/20 backdrop-blur-[2px] flex flex-col z-10 h-full`}
            >
              <Suspense
                fallback={
                  <div className="p-8 text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">
                    Synchronisatie...
                  </div>
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
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                    <span className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">
                      Initialiseren
                    </span>
                  </div>
                </div>
              }
            >
              {activeModule && MODULE_COMPONENTS[activeModule]?.Stage && (
                (() => {
                  const Stage = MODULE_COMPONENTS[activeModule].Stage;
                  return <Stage />;
                })()
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PhilosophyLabLayoutV2 = (props: { initialModule?: string }) => {
  const { module: activeModule } = useParams();

  return (
    <PhilosophyLabProvider initialModule={activeModule || props.initialModule}>
      <div className="w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule || "hub"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PhilosophyLabLayoutInner />
          </motion.div>
        </AnimatePresence>
      </div>
    </PhilosophyLabProvider >
  );
};
