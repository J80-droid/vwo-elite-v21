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
import { INITIAL_SUBJECTS } from "@shared/assets/data/initialSubjects";
import { useLibraryStore } from "@shared/model/libraryStore";
import React, { useMemo, useState } from "react";

import { LibrarySubject } from "../types/library.types";
import { AddSubjectTile } from "./AddSubjectTile";
import { SubjectTile } from "./SubjectTile";

interface LibraryGridProps {
  onSelect?: (subjectName: string) => void;
}

const SortableSubjectTile = ({
  subject,
  onSelect,
  isOverlay = false,
}: {
  subject: LibrarySubject;
  onSelect?: (name: string) => void;
  isOverlay?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subject.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 0 : 1,
    height: "100%",
  };

  if (isOverlay) {
    return (
      <div className="h-full scale-105 cursor-grabbing z-50">
        <SubjectTile subject={subject} onClick={() => { }} />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="h-full touch-none"
    >
      <SubjectTile subject={subject} onClick={() => onSelect?.(subject.id)} />
    </div>
  );
};

export const LibraryGrid: React.FC<LibraryGridProps> = ({ onSelect }) => {
  const { subjectOrder, setSubjectOrder } = useLibraryStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const items = useMemo(() => {
    const existingIds = INITIAL_SUBJECTS.map((s) => s.id);
    if (subjectOrder.length > 0) {
      return [...INITIAL_SUBJECTS]
        .filter((item) => existingIds.includes(item.id))
        .sort((a, b) => {
          const indexA = subjectOrder.indexOf(a.id);
          const indexB = subjectOrder.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
    }
    return INITIAL_SUBJECTS;
  }, [subjectOrder]);

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
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setSubjectOrder(newItems.map((item) => item.id));
    }
    setActiveId(null);
  };

  const activeSubject = items.find((s) => s.id === activeId);

  return (
    <div className="relative h-full bg-[#02040a] px-8 pb-8 pt-8 lg:px-12 lg:pb-12 lg:pt-12 overflow-y-auto custom-scrollbar overflow-x-hidden">
      <div className="relative z-10 max-w-[1800px] mx-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((s) => s.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
              {items.map((subject) => (
                <SortableSubjectTile
                  key={subject.id}
                  subject={subject}
                  {...(onSelect ? { onSelect } : {})}
                />
              ))}
              <div className="h-full">
                <AddSubjectTile />
              </div>
            </div>
          </SortableContext>

          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: "0" } },
              }),
            }}
          >
            {activeSubject ? (
              <SortableSubjectTile
                subject={activeSubject}
                onSelect={() => { }}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
