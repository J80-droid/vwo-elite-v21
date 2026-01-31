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
import { CSS } from "@dnd-kit/utilities";
import { useCanvasReady } from "@shared/hooks/useCanvasReady";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useHubStore } from "@shared/model/hubStore";
import { LabNavCategory, LabSidebar } from "@shared/ui/LabSidebar";
import { Box, Layers } from "lucide-react";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAllModules, getModuleConfig } from "../api/registry";
import { ThreeDLabProvider } from "../hooks/ThreeDLabContext";
import { useThreeDLabContext } from "../hooks/useThreeDLabContext";
import { ThreeDModuleConfig } from "../types";
import { registerThreeDModules } from "./modules";

// Register modules at module level to ensure availability before first render
registerThreeDModules();

const NAV_CATEGORIES: LabNavCategory[] = [
  {
    id: "ruimtelijk",
    label: (t: (key: string, defaultValue?: string) => string) =>
      t("studio_3d.categories.spatial", "Ruimtelijk"),
    modules: ["spatial", "stereo", "cross_section"],
  },
  {
    id: "constructie",
    label: (t: (key: string, defaultValue?: string) => string) =>
      t("studio_3d.categories.construction", "Constructie"),
    modules: ["build", "construction"],
  },
  {
    id: "projectie",
    label: (t: (key: string, defaultValue?: string) => string) =>
      t("studio_3d.categories.projection", "Projectie"),
    modules: ["projection", "slicer"],
  },
];

// Module Color Themes - Matches Library/Chemistry subtle neon style
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
  spatial: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    text: "text-cyan-400",
    shadow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
    icon: "text-cyan-400",
    glow: "from-cyan-500/20 to-blue-600/5",
  },
  stereo: {
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/5",
    text: "text-indigo-400",
    shadow: "shadow-[0_0_15px_rgba(99,102,241,0.1)]",
    icon: "text-indigo-400",
    glow: "from-indigo-500/20 to-blue-600/5",
  },
  slicer: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    text: "text-rose-400",
    shadow: "shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    icon: "text-rose-400",
    glow: "from-rose-500/20 to-orange-600/5",
  },
  build: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    shadow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    icon: "text-amber-400",
    glow: "from-amber-500/20 to-yellow-600/5",
  },
  projection: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    icon: "text-emerald-400",
    glow: "from-emerald-500/20 to-teal-600/5",
  },
  construction: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    shadow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    icon: "text-blue-400",
    glow: "from-blue-500/20 to-indigo-600/5",
  },
  cross_section: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    text: "text-violet-400",
    shadow: "shadow-[0_0_15px_rgba(139,92,246,0.1)]",
    icon: "text-violet-400",
    glow: "from-violet-500/20 to-purple-600/5",
  },
};

const DEFAULT_THEME = {
  border: "border-cyan-500/30",
  bg: "bg-cyan-500/5",
  text: "text-cyan-400",
  shadow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
  icon: "text-cyan-400",
  glow: "from-cyan-500/20 to-blue-600/5",
};

// Sortable Module Card Component
const SortableModuleCard = ({
  mod,
  onSelect,
  t,
  isOverlay = false,
}: {
  mod: ThreeDModuleConfig;
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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : 1,
  };

  // Helper to get translated description or default
  const getDescription = () => {
    return typeof mod.description === "function"
      ? mod.description(t)
      : mod.description;
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
                Elite Studio
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
                Elite Studio
              </p>
            </div>
          </div>
        </div>

        {/* Middle Row: Visual/Status */}
        <div className="flex items-center gap-6 mt-2 relative z-10">
          {/* Placeholder for stats */}
          <div className="relative w-16 h-12 flex items-center justify-center rounded-lg bg-white/5 border border-white/5">
            <Layers size={20} className={`opacity-50 ${theme.icon}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${theme.text}`}>Ready</span>
            <span className="text-xs text-slate-400 line-clamp-1">
              {getDescription()}
            </span>
          </div>
        </div>

        {/* Bottom Row: Context */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Box
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

// LOCAL COMPONENT REGISTRY - components are lazy-loaded
const MODULE_COMPONENTS: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.LazyExoticComponent<React.ComponentType<any>>
> = {
  spatial: React.lazy(() =>
    import("./modules/spatial/SpatialTrainer").then((m) => ({
      default: m.default,
    })),
  ),
  stereo: React.lazy(() =>
    import("./modules/stereo/StereoTrainer").then((m) => ({
      default: m.StereoTrainer,
    })),
  ),
  slicer: React.lazy(() =>
    import("./views/DynamicSlicer").then((m) => ({ default: m.DynamicSlicer })),
  ),
  build: React.lazy(() =>
    import("./views/BuildMode").then((m) => ({ default: m.BuildMode })),
  ),
  projection: React.lazy(() =>
    import("./views/ProjectionChallenge").then((m) => ({
      default: m.ProjectionChallenge,
    })),
  ),
  construction: React.lazy(() =>
    import("./views/ConstructionGame").then((m) => ({
      default: m.ConstructionGame,
    })),
  ),
  cross_section: React.lazy(() =>
    import("./views/CrossSectionChallenge").then((m) => ({
      default: m.CrossSectionChallenge,
    })),
  ),
};

const ThreeDLabLayoutInner: React.FC = () => {
  const { activeModule, setActiveModule } = useThreeDLabContext();
  const { module } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslations();
  const { threeDModuleOrder, setThreeDModuleOrder } = useHubStore();
  useCanvasReady(); // Ensure canvas is ready

  const allModules = getAllModules();
  // Hydrate modules order from persisted state or default
  const processedModules = React.useMemo(() => {
    const modules = getAllModules();
    if (threeDModuleOrder.length > 0) {
      return [...modules].sort((a, b) => {
        const indexA = threeDModuleOrder.indexOf(a.id);
        const indexB = threeDModuleOrder.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    return modules;
  }, [threeDModuleOrder]); // Only depend on order. getAllModules handles the registry state.

  const [sortedModules, setSortedModules] =
    useState<ThreeDModuleConfig[]>(processedModules);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Keep sortedModules in sync if processedModules changes (e.g. initial hydration)
  useEffect(() => {
    setSortedModules(processedModules);
  }, [processedModules]);

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
        setSortedModules(newItems);
        setThreeDModuleOrder(newItems.map((m) => m.id));
      }
      setActiveId(null);
    },
    [sortedModules, setThreeDModuleOrder],
  );

  const activeModuleCard = sortedModules.find((m) => m.id === activeId);

  // Sync URL param with internal state
  useEffect(() => {
    if (module && module !== activeModule) {
      setActiveModule(module);
    } else if (!module && activeModule) {
      setActiveModule(null);
    }
  }, [module, activeModule, setActiveModule]);

  const handleModuleSelect = (moduleId: string) => {
    navigate(`/3d-studio/${moduleId}`);
  };

  const activeConfig = getModuleConfig(activeModule);
  const ActiveStageComponent = activeModule
    ? MODULE_COMPONENTS[activeModule]
    : null;

  return (
    <div className="flex h-full bg-black overflow-hidden relative font-outfit">
      {/* 1. STAGE (Main Visualization Layer) */}
      <div
        id="threed-stage"
        className="absolute inset-0 z-0 bg-gradient-to-b from-obsidian-950 to-black"
      >
        {/* Background Grid/Effect */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="absolute inset-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-cyan-500 animate-pulse gap-3">
                <Box size={32} />
                <span className="font-mono text-sm tracking-widest">
                  {t("studio_3d.loading", "LOADING 3D ENVIRONMENT...")}
                </span>
              </div>
            }
          >
            {activeConfig && ActiveStageComponent ? (
              <div className="flex flex-col h-full w-full relative">
                {/* TOP NAVIGATION HEADER */}
                <div className="h-16 border-b border-white/10 bg-black/60 backdrop-blur-xl flex items-center px-6 justify-between z-40 shrink-0">
                  <div className="flex items-center gap-4">
                    {/* Back to Hub Button */}
                    <button
                      onClick={() => navigate("/3d-studio")}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mr-4"
                    >
                      <Box
                        className="text-cyan-500/80 group-hover:scale-110 transition-transform"
                        size={20}
                      />
                      <span className="font-bold text-lg bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent uppercase tracking-tight">
                        {t("studio_3d.title", "3D Studio")}
                      </span>
                    </button>

                    <div className="h-4 w-px bg-white/10 mx-2" />

                    <div className="flex items-center gap-2">
                      {activeConfig && (
                        <>
                          <activeConfig.icon
                            size={16}
                            className="text-cyan-400"
                          />
                          <span className="text-sm font-bold uppercase tracking-widest text-slate-300">
                            {activeConfig.label(t)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 flex items-center gap-2 uppercase tracking-widest text-[9px] font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                      Elite 3D Engine
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex min-h-0 relative items-stretch overflow-hidden">
                  {/* 1. MODULES SIDEBAR (Standardized) */}
                  <LabSidebar
                    activeModule={activeModule || ""}
                    onSelect={handleModuleSelect}
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
                    t={t}
                    modules={allModules}
                    categories={NAV_CATEGORIES}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    themes={MODULE_THEMES as any}
                    defaultTheme={DEFAULT_THEME}
                    labTitle="3D Studio"
                    onBack={() => navigate("/3d-studio")}
                  />
                  {/* Active Module Stage */}
                  <div className="flex-1 relative overflow-hidden">
                    <ActiveStageComponent />
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar">
                <div className="min-h-full w-full flex flex-col items-center p-8 pt-24 pb-48">
                  <div className="max-w-6xl w-full">
                    {/* Header */}
                    <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                      <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                          3D
                        </span>{" "}
                        STUDIO
                      </h1>
                      <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {t(
                          "studio_3d.hub_description",
                          "Select a module to begin your spatial exploration. Master complex geometries, projections, and structures.",
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
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export const ThreeDLabLayout: React.FC<{ initialModule?: string }> = ({
  initialModule,
}) => {
  return (
    <ThreeDLabProvider initialModule={initialModule}>
      <ThreeDLabLayoutInner />
    </ThreeDLabProvider>
  );
};
