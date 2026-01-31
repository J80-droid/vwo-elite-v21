/**
 * MathLab Hub View
 *
 * Module selection grid with drag-and-drop reordering.
 */

import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
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
} from "@dnd-kit/sortable";
import { getAllModules } from "@features/math/api/registry";
import type { MathModuleConfig } from "@features/math/types";
import { useHubStore } from "@shared/model/hubStore";
import { Sigma as SigmaIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { ModuleCard } from "./ModuleCard";

interface HubViewProps {
  onModuleSelect: (moduleId: string) => void;
  t: (key: string, fallback?: string) => string;
}

export const HubView: React.FC<HubViewProps> = ({ onModuleSelect, t }) => {
  const allModules = getAllModules();
  const { mathModuleOrder, setMathModuleOrder } = useHubStore();
  const [sortedModules, setSortedModules] =
    useState<MathModuleConfig[]>(allModules);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Hydrate modules order from persisted state
  useEffect(() => {
    if (mathModuleOrder && mathModuleOrder.length > 0) {
      const sorted = [...allModules].sort((a, b) => {
        const indexA = mathModuleOrder.indexOf(a.id);
        const indexB = mathModuleOrder.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      setSortedModules(sorted);
    } else {
      setSortedModules(allModules);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mathModuleOrder?.length]);

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
        setMathModuleOrder(newItems.map((m) => m.id));
      }
      setActiveId(null);
    },
    [sortedModules, setMathModuleOrder],
  );

  const activeModuleCard = activeId
    ? sortedModules.find((m) => m.id === activeId)
    : null;

  return (
    <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center p-8 pt-12 pb-16">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
              <SigmaIcon className="inline-block mr-4 mb-2" size={56} />
              MATH
            </span>{" "}
            LAB
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t(
              "calculus.hub_description",
              "Advanced mathematical engine. Explore analytics, spatial geometry, and symbolic systems.",
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
                <ModuleCard
                  key={mod.id}
                  mod={mod}
                  onSelect={onModuleSelect}
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
              <ModuleCard
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
