/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useTranslations } from "@shared/hooks/useTranslations";
import { MeshViewer } from "@shared/ui/components/MeshViewer";
import { Atom, List } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAllModules, PhysicsModuleConfig } from "../api/registry";
import { DEFAULT_THEME, MODULE_THEMES } from "../types/themes";

// --- CARD COMPONENT ---
// --- Card Content Component ---
const PhysicsCardContent = ({
  mod,
  onSelect,
  t,
  isOverlay = false,
  isDragging = false,
}: {
  mod: PhysicsModuleConfig;
  onSelect?: (id: string) => void;
  t: any;
  isOverlay?: boolean;
  isDragging?: boolean;
}) => {
  const theme = MODULE_THEMES[mod.id] || DEFAULT_THEME;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`
            relative p-6 rounded-3xl border backdrop-blur-md transition-all duration-300
            ${isOverlay ? "bg-black/80 shadow-2xl scale-105 border-white/20" : "bg-black/40 border-white/5 hover:bg-black/60"}
            flex flex-col justify-between h-56
            ${!isOverlay && !isDragging ? "group cursor-pointer" : ""}
            ${theme.border}/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]
            ${isDragging ? "opacity-30" : "opacity-100"}
        `}
      onClick={() => onSelect?.(mod.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex items-start justify-between relative z-10"
        {...(!isOverlay ? { style: { pointerEvents: "none" } } : {})}
      >
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
              Elite Physics
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-2 relative z-10">
        <div className="relative w-16 h-12 flex items-center justify-center rounded-lg bg-black/40 border border-white/5 overflow-hidden">
          {isHovered || isOverlay ? (
            <MeshViewer url={`/models/physics/${mod.id}_apparatus.glb`} autoRotate shadows={false} />
          ) : (
            <div className="flex items-center justify-center opacity-20">
              <mod.icon size={28} className={theme.text} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-bold ${theme.text}`}>Ready</span>
          <span className="text-xs text-slate-400 line-clamp-1">
            Physics Engine // Spatial Data
          </span>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <List
            size={14}
            className="text-slate-500 group-hover:text-cyan-400 transition-colors"
          />
          <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
            VWO Module
          </span>
        </div>

        <div
          className={`
                    font-mono text-[10px] font-black tracking-[0.2em] px-4 py-1.5 rounded-lg
                    transition-all duration-300 border
                    ${theme.text} ${theme.border.replace("border-", "border-")}/40
                    group-hover:bg-white/5 group-hover:border-white/40 group-hover:text-white
                    group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]
                `}
        >
          OPEN
        </div>
      </div>

      <div
        className={`absolute -inset-1 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${theme.glow.replace("group-hover:", "")}`}
      />
    </div>
  );
};

// --- Sortable Wrapper ---
const SortablePhysicsCard = ({
  mod,
  onSelect,
  t,
}: {
  mod: PhysicsModuleConfig;
  onSelect: (id: string) => void;
  t: any;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none h-full"
    >
      <PhysicsCardContent
        mod={mod}
        onSelect={onSelect}
        t={t}
        isDragging={isDragging}
      />
    </div>
  );
};

export const PhysicsLabHub: React.FC = () => {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const allModules = getAllModules();
  const [sortedModules, setSortedModules] =
    useState<PhysicsModuleConfig[]>(allModules);
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
        setSortedModules((items) => arrayMove(items, oldIndex, newIndex));
      }
      setActiveId(null);
    },
    [sortedModules],
  );

  const activeModuleCard = sortedModules.find((m) => m.id === activeId);

  return (
    <div className="z-10 w-full flex flex-col items-center justify-start p-8 pt-8 pb-32">
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
            {t(
              "physics.hub_description",
              "Advanced physics simulations. Explore mechanics, quantum dynamics, and wave theory.",
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
                <SortablePhysicsCard
                  key={mod.id}
                  mod={mod}
                  onSelect={(id) => navigate(`/physics/${id}`)}
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
              <PhysicsCardContent
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
  );
};
