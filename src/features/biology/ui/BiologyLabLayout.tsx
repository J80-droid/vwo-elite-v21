import "./modules"; // Register modules

import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS, Transform } from "@dnd-kit/utilities";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useHubStore } from "@shared/model/hubStore";
import { LabNavCategory, LabSidebar } from "@shared/ui/LabSidebar";
import {
  Award,
  BookOpen,
  Dna,
  Layers,
  Settings,
  Sigma,
  X,
} from "lucide-react";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAllModules, getModuleConfig } from "../api/registry";
import { BiologyLabProvider } from "../hooks/BiologyLabContext";
import { useBiologyLabContext } from "../hooks/useBiologyLabContext";
import type { BiologyModuleConfig } from "../types";
import { ExamModule } from "./common/ExamModule";
import { MasteryDashboard } from "./common/MasteryDashboard";

// Module Color Themes - Matches Library/Chemistry subtle neon style
const NAV_CATEGORIES: LabNavCategory[] = [
  {
    id: "training",
    label: (t: (key: string, defaultValue?: string) => string) =>
      t("biology.categories.training", "Training"),
    modules: ["gym"],
  },
  {
    id: "cel_molecuul",
    label: (t: (key: string, defaultValue?: string) => string) =>
      t("biology.categories.cell_molecule", "Cel & Molecuul"),
    modules: ["genomics", "protein"],
  },
  {
    id: "systeem",
    label: (t: (key: string, defaultValue?: string) => string) =>
      t("biology.categories.system", "Systeem"),
    modules: ["microscopy", "physiology"],
  },
  {
    id: "interactie",
    label: (t: (key: string, defaultValue?: string) => string) =>
      t("biology.categories.interaction", "Interactie"),
    modules: ["ecology"],
  },
];

const MODULE_THEMES: Record<
  string,
  {
    border: string;
    bg: string;
    text: string;
    shadow: string;
    icon: string;
    glow: string;
  }
> = {
  genomics: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    icon: "text-emerald-400",
    glow: "from-emerald-500/20 to-teal-600/5",
  },
  microscopy: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    shadow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    icon: "text-blue-400",
    glow: "from-blue-500/20 to-indigo-600/5",
  },
  ecology: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    shadow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    icon: "text-amber-400",
    glow: "from-amber-500/20 to-yellow-600/5",
  },
  physiology: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    text: "text-rose-400",
    shadow: "shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    icon: "text-rose-400",
    glow: "from-rose-500/20 to-pink-600/5",
  },
  protein: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    text: "text-purple-400",
    shadow: "shadow-[0_0_15px_rgba(168,85,247,0.1)]",
    icon: "text-purple-400",
    glow: "from-purple-500/20 to-pink-600/5",
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

// --- LAZY MODULE COMPONENTS ---
const MODULE_COMPONENTS: Record<
  string,
  {
    Stage: React.LazyExoticComponent<React.FC<Record<string, unknown>>>;
    Sidebar?: React.LazyExoticComponent<React.FC<Record<string, unknown>>>;
    Parameters?: React.LazyExoticComponent<React.FC<Record<string, unknown>>>;
    Analysis?: React.LazyExoticComponent<React.FC<Record<string, unknown>>>;
  }
> = {
  ecology: {
    Stage: React.lazy(() => import("./modules/ecology/EcologyStage").then(m => ({ default: m.EcologyStage }))),
    Sidebar: React.lazy(() => import("./modules/ecology/EcologySidebar").then(m => ({ default: m.EcologySidebar }))),
    Parameters: React.lazy(() => import("./modules/ecology/EcologyParameters").then(m => ({ default: m.EcologyParameters }))),
    Analysis: React.lazy(() => import("./modules/ecology/EcologyAnalysis").then(m => ({ default: m.EcologyAnalysis }))),
  },
  genomics: {
    Stage: React.lazy(() => import("./modules/genomics/GenomicsStage").then(m => ({ default: m.GenomicsStage }))),
    Sidebar: React.lazy(() => import("./modules/genomics/GenomicsSidebar").then(m => ({ default: m.GenomicsSidebar }))),
    Parameters: React.lazy(() => import("./modules/genomics/GenomicsParameters").then(m => ({ default: m.GenomicsParameters }))),
    Analysis: React.lazy(() => import("./modules/genomics/GenomicsAnalysis").then(m => ({ default: m.GenomicsAnalysis }))),
  },
  microscopy: {
    Stage: React.lazy(() => import("./modules/microscopy/MicroscopyStage").then(m => ({ default: m.MicroscopyStage }))),
    Sidebar: React.lazy(() => import("./modules/microscopy/MicroscopySidebar").then(m => ({ default: m.MicroscopySidebar }))),
    Parameters: React.lazy(() => import("./modules/microscopy/MicroscopyParameters").then(m => ({ default: m.MicroscopyParameters }))),
    Analysis: React.lazy(() => import("./modules/microscopy/MicroscopyAnalysis").then(m => ({ default: m.MicroscopyAnalysis }))),
  },
  physiology: {
    Stage: React.lazy(() => import("./modules/physiology/PhysiologyStage").then(m => ({ default: m.PhysiologyStage }))),
    Sidebar: React.lazy(() => import("./modules/physiology/PhysiologySidebar").then(m => ({ default: m.PhysiologySidebar }))),
    Parameters: React.lazy(() => import("./modules/physiology/PhysiologyParameters").then(m => ({ default: m.PhysiologyParameters }))),
    Analysis: React.lazy(() => import("./modules/physiology/PhysiologyAnalysis").then(m => ({ default: m.PhysiologyAnalysis }))),
  },
  protein: {
    Stage: React.lazy(() => import("./modules/protein/ProteinStage").then(m => ({ default: m.ProteinStage }))),
    Sidebar: React.lazy(() => import("./modules/protein/ProteinSidebar").then(m => ({ default: m.ProteinSidebar }))),
    Parameters: React.lazy(() => import("./modules/protein/ProteinParameters").then(m => ({ default: m.ProteinParameters }))),
    Analysis: React.lazy(() => import("./modules/protein/ProteinAnalysis").then(m => ({ default: m.ProteinAnalysis }))),
  },
  gym: {
    Stage: React.lazy(() => import("./gym/BiologyGymStage").then(m => ({ default: m.BiologyGymStage }))),
  },
};

// Sortable Module Card Component
const SortableModuleCard = ({
  mod,
  onSelect,
  t,
  isOverlay = false,
}: {
  mod: BiologyModuleConfig;
  onSelect: (id: string) => void;
  t: (key: string, defaultValue?: string) => string;
  isOverlay?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id });

  const theme = MODULE_THEMES[mod.id] || DEFAULT_THEME;

  const style = {
    transform: CSS.Transform.toString(transform as Transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : 1,
  };

  if (isOverlay) {
    return (
      <div className="h-56 scale-105 cursor-grabbing z-50">
        <div
          className={`
                    relative p-6 rounded-3xl border backdrop-blur-md flex flex-col justify-between h-full
                    ${theme.border.replace("group-hover:", "")} bg-black/80 shadow-2xl
                `}
        >
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl bg-black/40 border border-white/5 ${theme.icon}`}
            >
              <mod.icon size={24} />
            </div>
            <div>
              <h3
                className={`text-xl font-black tracking-tight text-white uppercase`}
              >
                {mod.label(t)}
              </h3>
              <p
                className={`text-[10px] font-bold opacity-60 uppercase tracking-widest ${theme.icon}`}
              >
                Elite Biology
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none h-full"
    >
      <div
        onClick={() => onSelect(mod.id)}
        className={`
                    relative p-6 rounded-3xl border backdrop-blur-md transition-all duration-300
                    group cursor-pointer flex flex-col justify-between h-56
                    bg-black/40 border-white/5 hover:bg-black/60
                    ${theme.border} hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]
                `}
      >
        {/* Top Row: Identity */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl bg-black/40 border border-white/5 transition-colors duration-300 ${theme.icon} group-hover:bg-white/5`}
            >
              <mod.icon size={24} />
            </div>
            <div>
              <h3
                className={`text-xl font-black tracking-tight text-white uppercase group-hover:text-white/90 transition-colors`}
              >
                {mod.label(t)}
              </h3>
              <p
                className={`text-[10px] font-bold opacity-60 uppercase tracking-widest ${theme.text}`}
              >
                Elite Biology
              </p>
            </div>
          </div>
        </div>

        {/* Middle Row: Visual/Status */}
        <div className="flex items-center gap-6 mt-2 relative z-10">
          <div className="relative w-16 h-12 flex items-center justify-center rounded-lg bg-white/5 border border-white/5">
            <Dna size={20} className={`opacity-50 ${theme.icon}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${theme.text}`}>Ready</span>
            <span className="text-xs text-slate-400 line-clamp-1">
              Biological Systems
            </span>
          </div>
        </div>

        {/* Bottom Row: Context */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Dna
              size={14}
              className="text-slate-500 group-hover:text-cyan-400 transition-colors"
            />
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
              VWO Module
            </span>
          </div>

          <div
            className={`
                        font-mono text-sm font-bold bg-black/30 px-3 py-1 rounded
                        transition-all duration-300
                        ${theme.text} group-hover:bg-white/10
                    `}
          >
            OPEN
          </div>
        </div>

        {/* Glow Effect */}
        <div
          className={`absolute -inset-1 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${theme.glow.replace("group-hover:", "")}`}
        />
      </div>
    </div>
  );
};

const BiologyLabLayoutInner: React.FC = () => {
  const { activeModule, setActiveModule } = useBiologyLabContext();
  const [showMastery, setShowMastery] = useState(false);
  const [showExam, setShowExam] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { t } = useTranslations();
  const { module } = useParams();
  const navigate = useNavigate();
  const { biologyModuleOrder, setBiologyModuleOrder } = useHubStore();

  // Registry
  const allModules = getAllModules();
  const activeConfig = getModuleConfig(activeModule);

  // Hub State
  // Derived State
  const sortedModules = useMemo(() => {
    if (biologyModuleOrder && biologyModuleOrder.length > 0) {
      return [...allModules].sort((a, b) => {
        const indexA = biologyModuleOrder.indexOf(a.id);
        const indexB = biologyModuleOrder.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    return allModules;
  }, [allModules, biologyModuleOrder]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = sortedModules.findIndex((m) => m.id === active.id);
        const newIndex = sortedModules.findIndex((m) => m.id === over.id);
        const newItems = arrayMove(sortedModules, oldIndex, newIndex);
        setBiologyModuleOrder(newItems.map((m) => m.id));
      }
      setActiveId(null);
    },
    [sortedModules, setBiologyModuleOrder],
  );

  const activeModuleCard = sortedModules.find((m) => m.id === activeId);

  // Sync URL param with internal state
  useEffect(() => {
    if (module && module !== activeModule) {
      setActiveModule(module);
    } else if (!module && activeModule) {
      setActiveModule("");
    }
  }, [module, activeModule, setActiveModule]);

  const handleModuleSelect = (moduleId: string) => {
    navigate(`/biology/${moduleId}`);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HUB VIEW: Show when no module available
  // ─────────────────────────────────────────────────────────────────────────
  if (!activeConfig || !activeModule) {
    return (
      <div className="flex h-full bg-black overflow-hidden relative font-outfit">
        {/* Background Grid/Effect */}
        <div
          id="biology-hub-stage"
          className="absolute inset-0 z-0 bg-gradient-to-b from-obsidian-950 to-black"
        >
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />
        </div>

        <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar">
          <div className="min-h-full w-full flex flex-col items-center justify-center p-8 pt-12 pb-16">
            <div className="max-w-6xl w-full">
              {/* Header */}
              <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600">
                    <Dna className="inline-block mr-4 mb-2" size={56} />
                    BIOLOGY
                  </span>{" "}
                  LAB
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  {t(
                    "biology.hub_description",
                    "Explore the complexities of life. From genomics to ecosystems.",
                  )}
                </p>
              </div>

              {/* Grid with Drag & Drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedModules.map((m) => m.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    {sortedModules.map((mod) => (
                      <SortableModuleCard
                        key={mod.id}
                        mod={mod}
                        onSelect={handleModuleSelect}
                        t={t}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay
                  dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                      styles: { active: { opacity: "0.4" } },
                    }),
                  }}
                >
                  {activeModuleCard ? (
                    <SortableModuleCard
                      mod={activeModuleCard}
                      onSelect={() => { }}
                      t={t}
                      isOverlay
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE VIEW
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-black overflow-hidden relative font-outfit text-white">

      <div className="flex-1 flex min-h-0 relative items-stretch overflow-hidden">
        {/* 1. MODULES SIDEBAR (Standardized) */}
        <LabSidebar
          activeModule={activeModule}
          onSelect={(id) => {
            handleModuleSelect(id);
            setShowMastery(false);
            setShowExam(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
          t={t}
          modules={allModules}
          categories={NAV_CATEGORIES}
          themes={MODULE_THEMES}
          defaultTheme={DEFAULT_THEME}
          labTitle="Biology Lab"
          onBack={() => navigate("/biology")}
        />
        {/* 1. LEFT SIDEBAR: INSTRUMENTATION */}
        <div className="w-80 h-full bg-obsidian-950/80 backdrop-blur-2xl border-r border-white/5 flex flex-col z-40 relative">
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
            <div className="pt-2">
              <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                <Layers size={12} /> {t("biology.layout.instrumentation")}
              </h4>
              <div className="space-y-4 animate-in slide-in-from-left-4 duration-500">
                {activeModule && MODULE_COMPONENTS[activeModule]?.Sidebar ? (
                  <Suspense
                    fallback={
                      <div className="p-4 text-xs text-slate-500 animate-pulse">
                        Loading controls...
                      </div>
                    }
                  >
                    {(() => {
                      const Sidebar = MODULE_COMPONENTS[activeModule].Sidebar;
                      return <Sidebar />;
                    })()}
                  </Suspense>
                ) : (
                  <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-slate-600 text-[10px] italic">
                    Geen parameters beschikbaar
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Cards */}
          <div className="p-4 mt-auto border-t border-white/5 space-y-2">
            <button
              onClick={() => setShowMastery(!showMastery)}
              className={`w-full p-2.5 rounded-xl border backdrop-blur-md transition-all flex items-center gap-3 ${showMastery ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white group"}`}
            >
              <Award
                size={16}
                className={
                  showMastery
                    ? "text-amber-400"
                    : "text-slate-500 group-hover:text-amber-400"
                }
              />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Mastery Dashboard
              </span>
            </button>
            <button
              onClick={() => setShowExam(!showExam)}
              className={`w-full p-2.5 rounded-xl border backdrop-blur-md transition-all flex items-center gap-3 ${showExam ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white group"}`}
            >
              <BookOpen
                size={16}
                className={
                  showExam
                    ? "text-indigo-400"
                    : "text-slate-500 group-hover:text-indigo-400"
                }
              />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Examen Trainer
              </span>
            </button>
          </div>
        </div>

        {/* 2. MAIN HUB (STAGE) */}
        <div className="flex-1 h-full relative flex flex-col min-w-0">
          <div
            id="biology-stage"
            className="absolute inset-0 z-0 bg-gradient-to-b from-obsidian-950 to-black overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

            <div className="absolute inset-0 flex items-center justify-center">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full text-emerald-500 animate-pulse gap-3">
                    <Dna size={32} />
                    <span className="font-mono text-sm tracking-widest uppercase">
                      Initializing Biosystem...
                    </span>
                  </div>
                }
              >
                {activeModule && MODULE_COMPONENTS[activeModule]?.Stage ? (
                  (() => {
                    const Stage = MODULE_COMPONENTS[activeModule].Stage;
                    return <Stage />;
                  })()
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600">
                    <div className="text-center">
                      <Dna size={64} className="mx-auto mb-4 opacity-20" />
                      <p>Select a module to begin simulation</p>
                    </div>
                  </div>
                )}
              </Suspense>
            </div>
          </div>
        </div>

        {/* 3. RIGHT SIDEBAR: PARAMETERS & ANALYSIS */}
        <div className="w-[360px] h-full bg-obsidian-950/80 backdrop-blur-2xl border-l border-white/5 flex flex-col z-40 relative">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Parameters Component */}
            {activeModule && MODULE_COMPONENTS[activeModule]?.Parameters && (
              <div className="px-6 pt-8">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                  <Settings size={12} /> {t("biology.layout.parameters")}
                </h4>
                <div className="pb-8 animate-in slide-in-from-right-4 duration-500">
                  <Suspense
                    fallback={
                      <div className="p-4 text-xs text-slate-500 animate-pulse">
                        Loading parameters...
                      </div>
                    }
                  >
                    {(() => {
                      const Params = MODULE_COMPONENTS[activeModule].Parameters;
                      return <Params />;
                    })()}
                  </Suspense>
                </div>
              </div>
            )}

            {/* Analysis Component */}
            {activeModule && MODULE_COMPONENTS[activeModule]?.Analysis && (
              <div className="px-6 pt-8 border-t border-white/5 bg-black/10">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                  <Sigma size={12} /> {t("biology.layout.analysis")}
                </h4>
                <div className="pb-20 animate-in slide-in-from-right-4 duration-700">
                  <Suspense
                    fallback={
                      <div className="p-4 text-xs text-slate-500 animate-pulse">
                        Loading analysis...
                      </div>
                    }
                  >
                    {(() => {
                      const Analysis = MODULE_COMPONENTS[activeModule].Analysis;
                      return <Analysis />;
                    })()}
                  </Suspense>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-white/10 bg-black/20 text-[10px] text-slate-600 text-center uppercase tracking-widest font-black">
            Biology Lab Elite v3.0
          </div>
        </div>
      </div>

      {/* MODALS / OVERLAYS */}
      {showMastery && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-12 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-4xl max-h-full overflow-y-auto custom-scrollbar relative bio-glass rounded-3xl">
            <button
              onClick={() => setShowMastery(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
            >
              <X size={24} />
            </button>
            <MasteryDashboard />
          </div>
        </div>
      )}

      {showExam && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-12 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl h-[640px] relative">
            <button
              onClick={() => setShowExam(false)}
              className="absolute -top-12 right-0 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest"
            >
              SLUITEN <X size={20} />
            </button>
            <ExamModule moduleId={activeModule} />
          </div>
        </div>
      )}
    </div>
  );
};

export const BiologyLabLayout = (props: { initialModule?: string }) => {
  const providerProps = props.initialModule
    ? { initialModule: props.initialModule }
    : {};
  return (
    <BiologyLabProvider {...providerProps}>
      <BiologyLabLayoutInner />
    </BiologyLabProvider>
  );
};
