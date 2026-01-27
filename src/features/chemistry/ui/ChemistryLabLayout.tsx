/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "./modules";

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
import { getAllModules, getModuleConfig } from "@features/chemistry/api/registry";
import {
  ChemistryLabProvider,
  useChemistryLabContext,
} from "@features/chemistry/hooks/ChemistryLabContext";
import { ChemistryModuleConfig } from "@features/chemistry/types";
import { saveStudyMaterialSQL } from "@shared/api/sqliteService";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useHubStore } from "@shared/model/hubStore";
import { LabSidebar } from "@shared/ui/LabSidebar"; // LabModule, LabNavCategory, LabTheme only used as types, maybe? check usage
import { FlaskConical, Layers } from "lucide-react";
import React, { Suspense, useCallback, useEffect, useState } from "react";
// Force Update
import { useNavigate, useParams } from "react-router-dom";

// Module Color Themes - Matches Library SubjectTile subtle neon style
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
  visualizer: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    text: "text-cyan-400",
    shadow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
    icon: "text-cyan-400",
    glow: "from-cyan-500/20 to-blue-600/5",
  },
  reaction: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    text: "text-rose-400",
    shadow: "shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    icon: "text-rose-400",
    glow: "from-rose-500/20 to-orange-600/5",
  },
  titration: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    icon: "text-emerald-400",
    glow: "from-emerald-500/20 to-teal-600/5",
  },
  orbitals: {
    border: "border-fuchsia-500/30",
    bg: "bg-fuchsia-500/5",
    text: "text-fuchsia-400",
    shadow: "shadow-[0_0_15px_rgba(232,121,249,0.1)]",
    icon: "text-fuchsia-400",
    glow: "from-fuchsia-500/20 to-purple-600/5",
  },
  periodic: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    shadow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    icon: "text-amber-400",
    glow: "from-amber-500/20 to-yellow-600/5",
  },
  stoichiometry: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    text: "text-violet-400",
    shadow: "shadow-[0_0_15px_rgba(139,92,246,0.1)]",
    icon: "text-violet-400",
    glow: "from-violet-500/20 to-indigo-600/5",
  },
  electrochemistry: {
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    text: "text-yellow-400",
    shadow: "shadow-[0_0_15px_rgba(234,179,8,0.1)]",
    icon: "text-yellow-400",
    glow: "from-yellow-500/20 to-orange-600/5",
  },
  stereo: {
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/5",
    text: "text-indigo-400",
    shadow: "shadow-[0_0_15px_rgba(99,102,241,0.1)]",
    icon: "text-indigo-400",
    glow: "from-indigo-500/20 to-blue-600/5",
  },
  binas: {
    border: "border-slate-500/30",
    bg: "bg-slate-500/5",
    text: "text-slate-300",
    shadow: "shadow-[0_0_15px_rgba(148,163,184,0.1)]",
    icon: "text-slate-300",
    glow: "from-slate-500/20 to-gray-600/5",
  },
  spectrum: {
    border: "border-pink-500/30",
    bg: "bg-pink-500/5",
    text: "text-pink-400",
    shadow: "shadow-[0_0_15px_rgba(244,114,182,0.1)]",
    icon: "text-pink-400",
    glow: "from-pink-500/20 to-rose-600/5",
  },
  redox: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    text: "text-red-400",
    shadow: "shadow-[0_0_15px_rgba(239,68,68,0.1)]",
    icon: "text-red-400",
    glow: "from-red-500/20 to-orange-600/5",
  },
  "ph-engine": {
    border: "border-lime-500/30",
    bg: "bg-lime-500/5",
    text: "text-lime-400",
    shadow: "shadow-[0_0_15px_rgba(132,204,22,0.1)]",
    icon: "text-lime-400",
    glow: "from-lime-500/20 to-green-600/5",
  },
  energy: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    shadow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    icon: "text-blue-400",
    glow: "from-blue-500/20 to-cyan-600/5",
  },
};

const NAV_CATEGORIES = [
  {
    id: "basis",
    label: (t: any) => t("chemistry.categories.basis", "Basis"),
    modules: ["periodic", "binas", "stoichiometry", "spectrum"],
  },
  {
    id: "structuur",
    label: (t: any) => t("chemistry.categories.structure", "Structuur"),
    modules: ["orbitals", "stereo", "visualizer"],
  },
  {
    id: "reacties",
    label: (t: any) => t("chemistry.categories.reactions", "Reacties"),
    modules: [
      "redox",
      "ph-engine",
      "energy",
      "titration",
      "electrochemistry",
      "reaction",
    ],
  },
];

const DEFAULT_THEME = {
  border: "border-cyan-500/30",
  bg: "bg-cyan-500/5",
  text: "text-cyan-400",
  shadow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
  icon: "text-cyan-400",
  glow: "from-cyan-500/20 to-blue-600/5",
};

// --- LAZY MODULE COMPONENTS ---
const MODULE_COMPONENTS: Record<
  string,
  {
    Stage: React.LazyExoticComponent<any>;
    Input: React.LazyExoticComponent<any>;
  }
> = {
  visualizer: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/visualizer/VisualizerStage");
      return { default: (m as any).VisualizerStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/visualizer/VisualizerSidebar");
      return { default: (m as any).VisualizerSidebar || m };
    }),
  },
  periodic: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/periodic/PeriodicComponents");
      return { default: (m as any).PeriodicStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/periodic/PeriodicComponents");
      return { default: (m as any).PeriodicSidebar || m };
    }),
  },
  stoichiometry: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/stoichiometry/StoichiometryComponents");
      return { default: (m as any).StoichiometryStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/stoichiometry/StoichiometryComponents");
      return { default: (m as any).StoichiometrySidebar || m };
    }),
  },
  titration: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/titration/TitrationComponents");
      return { default: (m as any).TitrationStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/titration/TitrationComponents");
      return { default: (m as any).TitrationSidebar || m };
    }),
  },
  reaction: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/reaction/ReactionComponents");
      return { default: (m as any).ReactionStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/reaction/ReactionComponents");
      return { default: (m as any).ReactionSidebar || m };
    }),
  },
  binas: {
    Stage: React.lazy(async () => {
      const m = await import("./BinasPanel");
      return { default: (m as any).BinasStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./BinasPanel");
      return { default: (m as any).BinasControls || m };
    }),
  },
  snap: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/snap/SnapWrapper");
      return { default: (m as any).SnapWrapper || m };
    }),
    Input: React.lazy(() => Promise.resolve({ default: () => null })),
  },
  electrochemistry: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/electrochemistry/ElectroComponents");
      return { default: (m as any).ElectroStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/electrochemistry/ElectroComponents");
      return { default: (m as any).ElectroSidebar || m };
    }),
  },
  spectrum: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/spectrum/SpectrumComponents");
      return { default: (m as any).SpectrumStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/spectrum/SpectrumComponents");
      return { default: (m as any).SpectrumSidebar || m };
    }),
  },
  redox: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/redox/RedoxComponents");
      return { default: (m as any).RedoxStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/redox/RedoxComponents");
      return { default: (m as any).RedoxControls || m };
    }),
  },
  "ph-engine": {
    Stage: React.lazy(async () => {
      const m = await import("./modules/ph-engine/PHComponents");
      return { default: (m as any).PHStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/ph-engine/PHComponents");
      return { default: (m as any).PHControls || m };
    }),
  },
  energy: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/energy/EnergyComponents");
      return { default: (m as any).EnergyStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/energy/EnergyComponents");
      return { default: (m as any).EnergyControls || m };
    }),
  },
  stereo: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/stereo/StereoComponents");
      return { default: (m as any).StereoStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/stereo/StereoComponents");
      return { default: (m as any).StereoSidebar || m };
    }),
  },
  orbitals: {
    Stage: React.lazy(async () => {
      const m = await import("./modules/orbitals/OrbitalComponents");
      return { default: (m as any).OrbitalStage || m };
    }),
    Input: React.lazy(async () => {
      const m = await import("./modules/orbitals/OrbitalComponents");
      return { default: (m as any).OrbitalSidebar || m };
    }),
  },
};

const ChemistryLabLayoutInner: React.FC = () => {
  // Registry Initialization
  useEffect(() => {
    import("./modules").then((m) => m.registerChemistryModules());
  }, []);

  const { activeModule, setActiveModule } = useChemistryLabContext();

  const { module } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslations();
  const { chemistryModuleOrder, setChemistryModuleOrder } = useHubStore();

  const allModules = getAllModules();
  const [sortedModules, setSortedModules] =
    useState<ChemistryModuleConfig[]>(allModules);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hydrate modules order from persisted state
  useEffect(() => {
    if (chemistryModuleOrder.length > 0) {
      const sorted = [...allModules].sort((a, b) => {
        const indexA = chemistryModuleOrder.indexOf(a.id);
        const indexB = chemistryModuleOrder.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      setSortedModules(sorted);
    } else {
      setSortedModules(allModules);
    }
  }, [chemistryModuleOrder]); // Run when order changes

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
        setChemistryModuleOrder(newItems.map((m) => m.id));
      }
      setActiveId(null);
    },
    [sortedModules, setChemistryModuleOrder],
  );

  const activeModuleConfig = sortedModules.find((m) => m.id === activeId);

  const SortableModuleCard = ({
    mod,
    onSelect,
    t,
    isOverlay = false,
  }: {
    mod: ChemistryModuleConfig;
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

    // Helper to get translated description or default
    const getDescription = () => {
      if (mod.description) return mod.description(t);
      return t(`chemistry.modules.${mod.id}_desc`, "Interactive Simulation");
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
                  Elite Chem
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
                  Elite Chem
                </p>
              </div>
            </div>
          </div>

          {/* Middle Row: Visual/Status */}
          <div className="flex items-center gap-6 mt-2 relative z-10">
            {/* Placeholder for stats - mimicking the gauge but with chemistry data */}
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
              <FlaskConical
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

  // Sync URL param with internal state
  useEffect(() => {
    if (module && module !== activeModule) {
      setActiveModule(module);
    } else if (!module && activeModule) {
      setActiveModule("");
    }
  }, [module, activeModule, setActiveModule]);

  const handleModuleSelect = (moduleId: string) => {
    navigate(`/chemistry/${moduleId}`);
  };

  const activeConfig = getModuleConfig(activeModule);

  // Legacy Migration Logic
  useEffect(() => {
    const migrateOldData = async () => {
      const oldKey = "VWO_ELITE_CHEM_MOLS";
      const oldData = localStorage.getItem(oldKey);
      if (oldData) {
        try {
          const molecules = JSON.parse(oldData);
          for (const m of molecules) {
            await saveStudyMaterialSQL({
              id: `mol-${m.cid}`,
              type: "flashcard",
              title: m.name,
              content: JSON.stringify(m),
              subject: "scheikunde",
              tags: ["migrated", "molecule"],
            });
          }
          localStorage.removeItem(oldKey);
        } catch (e) {
          console.error("[ChemLab] Migration failed", e);
        }
      }
    };
    migrateOldData();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // HUB VIEW: Show when no module is selected
  // ─────────────────────────────────────────────────────────────────────────
  if (!activeConfig) {
    return (
      <div className="flex h-full bg-black overflow-hidden relative font-outfit">
        {/* Background Grid/Effect */}
        <div
          id="chemistry-stage"
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.1),transparent_50%)] pointer-events-none" />
        </div>

        <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar">
          <div className="min-h-full w-full flex flex-col items-center justify-center p-8 pt-12 pb-16">
            <div className="max-w-6xl w-full">
              {/* Header */}
              <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-500 to-teal-600">
                    <FlaskConical
                      className="inline-block mr-4 mb-2"
                      size={56}
                    />
                    CHEMISTRY
                  </span>{" "}
                  LAB
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  {t(
                    "chemistry.hub_description",
                    "Select a module to explore. Master molecular structures, reactions, and chemical principles.",
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
                  {activeModuleConfig ? (
                    <SortableModuleCard
                      mod={activeModuleConfig}
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
  // MODULE VIEW: Show when a module is selected
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full bg-black font-outfit text-white overflow-hidden relative isolate">

      {/* MAIN CONTENT ROW */}
      <div className="flex-1 flex min-h-0 relative items-stretch overflow-hidden">
        {/* 1. MODULES SIDEBAR (Categorized Elite Sidebar) */}
        <LabSidebar
          activeModule={activeModule}
          onSelect={handleModuleSelect}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
          t={t}
          modules={allModules as any}
          categories={NAV_CATEGORIES}
          themes={MODULE_THEMES as any}
          defaultTheme={DEFAULT_THEME}
          labTitle="Chemistry Lab"
        />

        {/* 2. LEFT SIDEBAR: CONTROLS - Sticky */}
        {activeModule !== "reaction" && (
          <div className="w-80 flex flex-col border-r border-white/10 bg-obsidian-950/80 backdrop-blur-sm z-30 h-full">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 opacity-50">
                <Layers size={14} /> Control Panel
              </div>

              <div className="min-h-[200px] animate-in slide-in-from-left-4 duration-500">
                {activeModule && MODULE_COMPONENTS[activeModule]?.Input ? (
                  <Suspense
                    fallback={
                      <div className="p-4 text-xs text-slate-500 animate-pulse">
                        Controls laden...
                      </div>
                    }
                  >
                    {(() => {
                      const Input = MODULE_COMPONENTS[activeModule].Input;
                      return <Input />;
                    })()}
                  </Suspense>
                ) : (
                  <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center text-slate-600 text-sm">
                    Geen specifieke controls beschikbaar.
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 border-t border-white/10 bg-black/20 text-[10px] text-slate-600 text-center">
              VWO Elite System v2.0
            </div>
          </div>
        )}

        {/* 2. CENTER: STAGE */}
        <div className="flex-1 flex flex-col relative min-w-0 bg-gradient-to-br from-obsidian-950 to-black overflow-visible min-h-full">
          <div
            className="absolute inset-x-0 top-0 h-full opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.08),transparent_50%)] pointer-events-none" />

          <div className="relative z-10 w-full h-full">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[400px] text-cyan-500 gap-3">
                  <FlaskConical size={32} className="animate-bounce" />
                </div>
              }
            >
              {activeModule && MODULE_COMPONENTS[activeModule]?.Stage ? (
                (() => {
                  const Stage = MODULE_COMPONENTS[activeModule].Stage;
                  return <Stage />;
                })()
              ) : (
                <div className="p-10 text-white">Module not found</div>
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChemistryLabLayout: React.FC = () => {
  return (
    <ChemistryLabProvider>
      <ChemistryLabLayoutInner />
    </ChemistryLabProvider>
  );
};
