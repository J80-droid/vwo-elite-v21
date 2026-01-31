import {
  Atom,
  Calendar,
  Camera,
  Download,
  Layers,
  Type,
  User,
  X,
} from "lucide-react";
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
import React, { Suspense, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useSaveStudyMaterial } from "@shared/hooks/useLocalData";
import { useTranslations } from "@shared/hooks/useTranslations";

import { LabNavCategory, LabSidebar } from "@shared/ui/LabSidebar";
import { ImmersiveControls } from "@shared/ui/ImmersiveControls";
import { ConceptQuiz } from "./common/ConceptQuiz";
import { SNAPSHOT_PRESETS } from "@features/math";
import { usePhysicsLabContext } from "../hooks/usePhysicsLabContext";
import { useTutor } from "./tutor/useTutor";
import { registerPhysicsModules } from "./modules";
import { PhysicsLabProvider } from "../hooks/PhysicsLabContext";
import { TutorProvider } from "./tutor/TutorContext";
import { getAllModules, getModuleConfig, PhysicsModuleConfig } from "../api/registry";
import { DEFAULT_THEME, MODULE_THEMES } from "../types/themes";
// Removed LazyPhysicsLabHub as it's now embedded
const LazyPhysicsGymStage = React.lazy(() => import("./gym/PhysicsGymStage").then(m => ({ default: m.PhysicsGymStage })));

// --- LAZY MODULE COMPONENTS ---
const MODULE_COMPONENTS: Record<
  string,
  {
    Stage?: React.LazyExoticComponent<React.FC<Record<string, unknown>>>;
    Sidebar?: React.LazyExoticComponent<React.FC<Record<string, unknown>>>;
    Parameters?: React.LazyExoticComponent<React.FC<Record<string, unknown>>>;
    Analysis?: React.LazyExoticComponent<React.FC<Record<string, unknown>>>;
  }
> = {
  spring: {
    Stage: React.lazy(() => import("./modules/spring/SpringStage").then(m => ({ default: m.SpringStage }))),
    Sidebar: React.lazy(() => import("./modules/spring/SpringSidebar").then(m => ({ default: m.SpringSidebar }))),
    Parameters: React.lazy(() => import("./modules/spring/SpringParameters").then(m => ({ default: m.SpringParameters }))),
    Analysis: React.lazy(() => import("./modules/spring/SpringAnalysis").then(m => ({ default: m.SpringAnalysis }))),
  },
  optics: {
    Stage: React.lazy(() => import("./modules/optics/OpticsStage").then(m => ({ default: m.OpticsStage }))),
    Sidebar: React.lazy(() => import("./modules/optics/OpticsSidebar").then(m => ({ default: m.OpticsSidebar }))),
  },
  circuits: {
    Stage: React.lazy(() => import("./modules/circuits/CircuitsStage").then(m => ({ default: m.CircuitsStage }))),
    Sidebar: React.lazy(() => import("./modules/circuits/CircuitsComponents").then(m => ({ default: m.CircuitsSidebar }))),
    Parameters: React.lazy(() => import("./modules/circuits/CircuitsComponents").then(m => ({ default: m.ParametersHUD }))),
    Analysis: React.lazy(() => import("./modules/circuits/CircuitsComponents").then(m => ({ default: m.AnalysisHUD }))),
  },
  waves: {
    Stage: React.lazy(() => import("./modules/waves/WavesStage").then(m => ({ default: m.WavesStage }))),
    Sidebar: React.lazy(() => import("./modules/waves/WavesSidebar").then(m => ({ default: m.WavesSidebar }))),
  },
  interference: {
    Stage: React.lazy(() => import("./modules/interference/InterferenceStage").then(m => ({ default: m.InterferenceStage }))),
    Sidebar: React.lazy(() => import("./modules/interference/InterferenceSidebar").then(m => ({ default: m.InterferenceSidebar }))),
  },
  vectors: {
    Stage: React.lazy(() => import("./modules/vectors/VectorsComponents").then(m => ({ default: m.VectorsStage }))),
    Sidebar: React.lazy(() => import("./modules/vectors/VectorsComponents").then(m => ({ default: m.VectorsSidebar }))),
    Parameters: React.lazy(() => import("./modules/vectors/VectorsComponents").then(m => ({ default: m.VectorsParameters }))),
    Analysis: React.lazy(() => import("./modules/vectors/VectorsComponents").then(m => ({ default: m.VectorsAnalysis }))),
  },
  mechanics: {
    Stage: React.lazy(() => import("./modules/mechanics/MechanicsStage").then(m => ({ default: m.MechanicsStage }))),
    Sidebar: React.lazy(() => import("./modules/mechanics/MechanicsSidebar").then(m => ({ default: m.MechanicsSidebar }))),
  },
  thermodynamics: {
    Stage: React.lazy(() => import("./modules/thermodynamics/ThermodynamicsStage").then(m => ({ default: m.ThermodynamicsStage }))),
    Sidebar: React.lazy(() => import("./modules/thermodynamics/ThermodynamicsComponents").then(m => ({ default: m.ThermoSidebar }))),
    Parameters: React.lazy(() => import("./modules/thermodynamics/ThermodynamicsComponents").then(m => ({ default: m.ParametersHUD }))),
    Analysis: React.lazy(() => import("./modules/thermodynamics/ThermodynamicsComponents").then(m => ({ default: m.AnalysisHUD }))),
  },
  kinematics: {
    Stage: React.lazy(() => import("./modules/kinematics/Kinematics3DStage").then(m => ({ default: m.Kinematics3DStage }))),
    Sidebar: React.lazy(() => import("./modules/kinematics/KinematicsSidebar").then(m => ({ default: m.KinematicsSidebar }))),
  },
  nuclear: {
    Stage: React.lazy(() => import("./modules/nuclear/NuclearStage").then(m => ({ default: m.NuclearStage }))),
    Sidebar: React.lazy(() => import("./modules/nuclear/NuclearSidebar").then(m => ({ default: m.NuclearSidebar }))),
  },
  quantum: {
    Stage: React.lazy(() => import("./modules/quantum/QuantumStage").then(m => ({ default: m.QuantumStage }))),
    Sidebar: React.lazy(() => import("./modules/quantum/QuantumSidebar").then(m => ({ default: m.QuantumSidebar }))),
  },
  magnetism: {
    Stage: React.lazy(() => import("./modules/magnetism/MagnetismStage").then(m => ({ default: m.MagnetismStage }))),
    Sidebar: React.lazy(() => import("./modules/magnetism/MagnetismSidebar").then(m => ({ default: m.MagnetismSidebar }))),
  },
  relativity: {
    Stage: React.lazy(() => import("./modules/relativity/RelativityStage").then(m => ({ default: m.RelativityStage }))),
    Sidebar: React.lazy(() => import("./modules/relativity/RelativitySidebar").then(m => ({ default: m.RelativitySidebar }))),
  },
  snap: {
    Stage: React.lazy(() => import("./modules/snap/SnapWrapper").then(m => ({ default: m.SnapWrapper }))),
  },
  modeling: {
    Stage: React.lazy(() => import("./modules/modeling/ModelStage").then(m => ({ default: m.ModelStage }))),
    Sidebar: React.lazy(() => import("./modules/modeling/ModelEditorSidebar").then(m => ({ default: m.ModelEditorSidebar }))),
    Parameters: React.lazy(() => import("./modules/modeling/ModelParameters").then(m => ({ default: m.ModelParameters }))),
  },
  astro: {
    Stage: React.lazy(() => import("./modules/astro/AstroLabStage").then(m => ({ default: m.AstroLabStage }))),
    Sidebar: React.lazy(() => import("./modules/astro/AstroSidebar").then(m => ({ default: m.AstroSidebar }))),
  },
  gym: {
    Stage: LazyPhysicsGymStage,
  },
};
import type { PhysicsModule } from "../types";

// Initialize registry immediately on load to prevent race conditions during module state initialization
registerPhysicsModules();

interface PhysicsLabLayoutProps {
  initialModule?: PhysicsModule;
}

// Module Color Themes - Matches Library/Chemistry subtle neon style

const NAV_CATEGORIES: LabNavCategory[] = [
  {
    id: "training",
    label: (t: (k: string, d?: string) => string) =>
      t("physics.categories.training", "Training"),
    modules: ["gym"],
  },
  {
    id: "basis",
    label: (t: (k: string, d?: string) => string) =>
      t("physics.categories.basis", "Basis"),
    modules: ["vectors", "mechanics", "kinematics"],
  },
  {
    id: "stoffen",
    label: (t: (k: string, d?: string) => string) =>
      t("physics.categories.substances", "Stoffen & Velden"),
    modules: ["thermodynamics", "circuits", "magnetism"],
  },
  {
    id: "trillingen",
    label: (t: (k: string, d?: string) => string) =>
      t("physics.categories.waves", "Trillingen & Golven"),
    modules: ["waves", "interference", "spring", "optics"],
  },
  {
    id: "modern",
    label: (t: (k: string, d?: string) => string) =>
      t("physics.categories.modern", "Modern & Astro"),
    modules: ["nuclear", "quantum", "relativity", "astro"],
  },
  {
    id: "tools",
    label: (t: (k: string, d?: string) => string) =>
      t("physics.categories.tools", "Tools"),
    modules: ["snap", "modeling"],
  },
];

const PhysicsLabLayoutInner: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    activeQuiz,
    endQuiz,
  } = usePhysicsLabContext();

  const { t } = useTranslations();
  const saveToLibrary = useSaveStudyMaterial();
  const { module } = useParams();
  const { updateContext } = useTutor();
  const navigate = useNavigate();

  // Sync Active Module to Tutor Context
  useEffect(() => {
    if (activeModule) {
      updateContext({ moduleId: activeModule });
    }
  }, [activeModule, updateContext]);

  // Registry Status
  const [isRegistryReady] = useState(true);

  const allModules = React.useMemo(() => isRegistryReady ? getAllModules() : [], [isRegistryReady]);
  const activeConfig = isRegistryReady
    ? getModuleConfig(activeModule as string)
    : undefined;

  // Snapshot State
  const [screenshotStatus, setScreenshotStatus] = useState<
    "idle" | "configuring" | "capturing" | "saved" | "error"
  >("idle");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [snapshotOpts, setSnapshotOpts] = useState(
    SNAPSHOT_PRESETS.quick ?? {
      showTitle: true,
      showTimestamp: true,
      showWatermark: true,
      customTitle: "",
    },
  );

  // Sync URL param with internal state
  useEffect(() => {
    if (module && module !== activeModule) {
      setActiveModule(module);
    } else if (!module && activeModule) {
      setActiveModule("");
    }
  }, [module, activeModule, setActiveModule]);

  const handleModuleSelect = (moduleId: string) => {
    navigate(`/physics/${moduleId}`);
  };



  const performCapture = async () => {
    const stage = document.getElementById("physics-stage");
    if (!stage) return;
    try {
      setScreenshotStatus("capturing");
      setIsCapturing(true);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Render wait
      const dataUrl = await toPng(stage, {
        backgroundColor: "#000",
        cacheBust: true,
        pixelRatio: 2,
      });
      const fileName = `PhysicsLab-${activeModule}-${new Date().toISOString()}.png`;
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      await saveToLibrary.mutateAsync({
        id: crypto.randomUUID(),
        name:
          snapshotOpts.customTitle ||
          `PhysicsLab ${activeModule} ${new Date().toLocaleTimeString()}`,
        type: "image",
        subject: "Natuurkunde",
        content: dataUrl,
        createdAt: Date.now(),
      });

      setScreenshotStatus("saved");
      setTimeout(() => setScreenshotStatus("idle"), 2000);
    } catch (e) {
      console.error("Capture failed:", e);
      setScreenshotStatus("error");
      setTimeout(() => setScreenshotStatus("idle"), 2000);
    } finally {
      setIsCapturing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HUB DND LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sortedModules, setSortedModules] = useState<PhysicsModuleConfig[]>(allModules);

  // Sync sorted modules with registry on load
  useEffect(() => {
    if (allModules.length > 0) {
      setSortedModules(allModules);
    }
  }, [allModules]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedModules.findIndex((m) => m.id === active.id);
      const newIndex = sortedModules.findIndex((m) => m.id === over.id);
      setSortedModules(arrayMove(sortedModules, oldIndex, newIndex));
    }
    setActiveId(null);
  };

  const activeModuleConfig = activeId
    ? sortedModules.find((m) => m.id === activeId)
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  // SORTABLE CARD COMPONENT (Embedded like Chemistry)
  // ─────────────────────────────────────────────────────────────────────────
  const SortableModuleCard = ({
    mod,
    onSelect,
    t,
    isOverlay = false,
  }: {
    mod: PhysicsModuleConfig;
    onSelect: (id: string) => void;
    t: any;
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

    const cardBaseClasses = `
      relative p-6 rounded-3xl border backdrop-blur-md transition-all duration-300
      group cursor-pointer flex flex-col justify-between h-56
      bg-black/40 border-white/5 hover:bg-black/60
      ${theme.border} hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]
    `;

    if (isOverlay) {
      return (
        <div className="h-56 scale-105 cursor-grabbing z-50">
          <div className={`relative p-6 rounded-3xl border backdrop-blur-md flex flex-col justify-between h-full bg-black/80 shadow-2xl border-white/20`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-black/40 border border-white/5 ${theme.icon}`}>
                <mod.icon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-white uppercase">{mod.label(t)}</h3>
                <p className={`text-[10px] font-bold opacity-60 uppercase tracking-widest ${theme.icon}`}>Elite Physics</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none h-full">
        <div onClick={() => onSelect(mod.id)} className={cardBaseClasses}>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-black/40 border border-white/5 transition-colors duration-300 ${theme.icon} group-hover:bg-white/5`}>
                <mod.icon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-white uppercase group-hover:text-white/90 transition-colors uppercase">{mod.label(t)}</h3>
                <p className={`text-[10px] font-bold opacity-60 uppercase tracking-widest ${theme.text}`}>Elite Physics</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-2 relative z-10">
            <div className="relative w-16 h-12 flex items-center justify-center rounded-lg bg-white/5 border border-white/5">
              <Layers size={20} className={`opacity-50 ${theme.icon}`} />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-bold ${theme.text}`}>Ready</span>
              <span className="text-xs text-slate-400 line-clamp-1">{t(`physics.modules.${mod.id}_desc`, "Interactive Simulation")}</span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Atom size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
              <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors">VWO Module</span>
            </div>
            <div className={`font-mono text-sm font-bold bg-black/30 px-3 py-1 rounded transition-all duration-300 ${theme.text} group-hover:bg-white/10`}>OPEN</div>
          </div>

          <div className={`absolute -inset-1 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${theme.glow.replace("group-hover:", "")}`} />
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HUB VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (!activeConfig || !activeModule) {
    return (
      <div className="flex h-full bg-black overflow-hidden relative font-outfit">
        {/* Background Grid/Effect */}
        <div id="physics-stage" className="absolute inset-0 z-0 bg-gradient-to-b from-obsidian-950 to-black">
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />
        </div>

        <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar">
          <div className="min-h-full w-full flex flex-col items-center justify-center p-8 pt-12 pb-16">
            <div className="max-w-6xl w-full">
              {/* Header */}
              <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600">
                    <Atom className="inline-block mr-4 mb-2" size={56} />
                    PHYSICS
                  </span>{" "}
                  LAB
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  {t("physics.hub_description", "Advanced physics simulations. Explore mechanics, quantum dynamics, and wave theory.")}
                </p>
              </div>

              {/* Grid with Drag & Drop */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={sortedModules.map((m) => m.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    {sortedModules.map((mod) => (
                      <SortableModuleCard key={mod.id} mod={mod} onSelect={handleModuleSelect} t={t} />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
                  {activeModuleConfig ? (
                    <SortableModuleCard mod={activeModuleConfig} onSelect={() => { }} t={t} isOverlay />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col w-full h-full bg-black font-outfit text-white relative isolate overflow-hidden rounded-none">


      {/* MAIN CONTENT ROW */}
      <div className="flex-1 flex min-h-0 relative items-stretch overflow-hidden">
        {/* 1. MODULES SIDEBAR (Standardized) - Allow full collapse for maximum area */}
        {activeModule && (
          <LabSidebar
            activeModule={activeModule}
            onSelect={handleModuleSelect}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
            t={t}
            modules={allModules}
            categories={NAV_CATEGORIES}
            themes={MODULE_THEMES}
            defaultTheme={DEFAULT_THEME}
            labTitle="Physics Lab"
            onBack={() => navigate("/physics")}
          />
        )}

        {/* 2. MAIN STAGE AREA: Takes 100% of remaining width */}
        <div
          className={`flex-1 relative min-w-0 bg-gradient-to-br from-obsidian-950 to-black ${activeModule === "relativity" ? "overflow-y-auto" : "overflow-hidden"}`}
        >
          {/* ...en gebruiken 'absolute inset-0' om de simulatie EXACT in dat vak te dwingen. 
              Hierdoor kan hij nooit groter worden dan het scherm. */}
          {/* Wrapper for the entire stage area - blocks events from reaching the background but allows them to pass through to overlays */}
          <div
            className={`${activeModule === "relativity" ? "relative w-full" : "absolute inset-0 w-full h-full"} flex flex-col pointer-events-none`}
          >
            {/* Background Visuals */}
            <div
              className="absolute inset-x-0 top-0 h-full opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

            {/* Simulation Component - This layer catches the events */}
            <div
              id="physics-stage"
              className={`relative z-10 w-full h-full flex flex-col pointer-events-auto ${activeModule && activeModule !== "gym" ? "items-center justify-center" : "items-center justify-start overflow-hidden"}`}
            >
              {activeModule && MODULE_COMPONENTS[activeModule]?.Stage ? (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full text-emerald-500 gap-3">
                      <Atom size={32} className="animate-spin-slow" />
                    </div>
                  }
                >
                  {(() => {
                    const Stage = activeModule ? MODULE_COMPONENTS[activeModule]?.Stage : undefined;
                    return Stage ? <Stage /> : null;
                  })()}
                </Suspense>
              ) : activeConfig ? (
                <Suspense fallback={null}>
                  <LazyPhysicsLabHub />
                </Suspense> // Fallback if stage component missing but config exists
              ) : (
                <Suspense fallback={null}>
                  <LazyPhysicsLabHub />
                </Suspense>
              )}
            </div>

            {/* HUD: TOP OVERLAY FOR PARAMETERS & ANALYSIS */}
            {activeConfig && (
              <div className="absolute top-4 inset-x-8 z-30 pointer-events-none flex justify-between items-start select-none">
                {/* Top Left: System Properties / Parameters Summary */}
                <div className="pointer-events-auto flex flex-col gap-4 max-w-[320px]">
                  {activeModule && MODULE_COMPONENTS[activeModule]?.Parameters && (
                    <div className="animate-in slide-in-from-top duration-700">
                      <Suspense fallback={null}>
                        {(() => {
                          const Params = activeModule ? MODULE_COMPONENTS[activeModule]?.Parameters : undefined;
                          return Params ? <Params /> : null;
                        })()}
                      </Suspense>
                    </div>
                  )}
                </div>

                {/* Top Right: Analysis / HUD Info */}
                <div className="pointer-events-auto flex flex-col gap-4 max-w-[320px]">
                  {activeModule && MODULE_COMPONENTS[activeModule]?.Analysis && (
                    <div className="animate-in slide-in-from-top duration-700 delay-100">
                      <Suspense fallback={null}>
                        {(() => {
                          const Analysis = activeModule ? MODULE_COMPONENTS[activeModule]?.Analysis : undefined;
                          return Analysis ? <Analysis /> : null;
                        })()}
                      </Suspense>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeConfig &&
              activeModule &&
              MODULE_COMPONENTS[activeModule]?.Sidebar &&
              activeModule !== "astro" &&
              activeModule !== "relativity" && (
                <ImmersiveControls
                  key={activeModule}
                  activeModuleLabel={activeConfig.label(t)}
                  defaultInstructionsOpen={false}
                  controls={
                    <Suspense fallback={null}>
                      {activeModule && MODULE_COMPONENTS[activeModule]?.Sidebar && (
                        (() => {
                          const Sidebar = MODULE_COMPONENTS[activeModule].Sidebar;
                          return Sidebar ? <Sidebar /> : null;
                        })()
                      )}
                    </Suspense>
                  }
                  instructions={
                    <div className="space-y-4">
                      <p className="opacity-80">
                        {t(
                          `physics.descriptions.${activeModule}`,
                          "This simulation allows you to explore the fundamental principles of physics through interactive experimentation.",
                        )}
                      </p>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 italic text-xs">
                        {t(
                          `physics.hints.${activeModule}`,
                          "Try adjusting the parameters in the bottom bar to see real-time effects.",
                        )}
                      </div>
                    </div>
                  }
                />
              )}

            {/* Snapshot Overlay logic... */}
            {isCapturing && (
              <div className="absolute inset-0 pointer-events-none z-[200] flex flex-col justify-between p-8 bg-black/10">
                <div className="flex justify-between items-start">
                  {(snapshotOpts.showTitle || snapshotOpts.showTimestamp) && (
                    <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-2xl max-w-md">
                      {snapshotOpts.showTitle && (
                        <h2 className="text-xl font-bold text-white mb-2">
                          {snapshotOpts.customTitle ||
                            "Physics Lab Elite Analysis"}
                        </h2>
                      )}
                      {snapshotOpts.showTimestamp && (
                        <div className="flex items-center gap-5 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                          <span className="flex items-center gap-1.5">
                            <User size={12} className="text-emerald-400" />{" "}
                            {t("physics.snapshot.student")}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-blue-400" />{" "}
                            {new Date().toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {snapshotOpts.showWatermark && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] shadow-lg backdrop-blur-md">
                    VWO Elite Physics Engine
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SNAPSHOT CONFIG MODAL */}
      {screenshotStatus === "configuring" && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1d21] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-in-center">
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} className="text-emerald-400" />{" "}
                {t("physics.snapshot.title")}
              </h3>
              <button
                onClick={() => setScreenshotStatus("idle")}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">
                  {t("physics.snapshot.report_title")}
                </label>
                <div className="relative group">
                  <Type
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors"
                  />
                  <input
                    type="text"
                    value={snapshotOpts.customTitle}
                    onChange={(e) =>
                      setSnapshotOpts((s) => ({
                        ...s,
                        customTitle: e.target.value,
                      }))
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={performCapture}
                  className="btn-elite-neon btn-elite-neon-emerald w-full !py-3 !text-[11px]"
                >
                  <Download size={14} /> {t("physics.snapshot.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONCEPT QUIZ LAYER */}
      {activeQuiz && (
        <ConceptQuiz
          isOpen={true}
          question={activeQuiz}
          onComplete={endQuiz}
        />
      )}
    </div>
  );
};

export const PhysicsLabLayout: React.FC<PhysicsLabLayoutProps> = ({
  initialModule,
}) => {
  return (
    <PhysicsLabProvider initialModule={initialModule}>
      <TutorProvider>
        <PhysicsLabLayoutInner />
      </TutorProvider>
    </PhysicsLabProvider>
  );
};
