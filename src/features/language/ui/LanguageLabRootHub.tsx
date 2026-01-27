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
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Simple Flag Components (SVG)
const FlagNL = () => (
  <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
    <path fill="#21468b" d="M0 0h640v480H0z" />
    <path fill="#fff" d="M0 0h640v320H0z" />
    <path fill="#ae1c28" d="M0 0h640v160H0z" />
  </svg>
);

const FlagFR = () => (
  <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
    <path fill="#fff" d="M0 0h640v480H0z" />
    <path fill="#002395" d="M0 0h213.3v480H0z" />
    <path fill="#ed2939" d="M426.7 0H640v480H426.7z" />
  </svg>
);

const FlagGB = () => (
  <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path
      fill="#fff"
      d="M75 0l245 168L565 0h75v42l-245 168L640 378v42l-245-168L150 420l-75 60v-42l245-168L75 102V60zM0 0l640 480"
    />
    <path
      fill="#fff"
      stroke="#fff"
      strokeWidth="60"
      d="M0 0L640 480M640 0L0 480"
    />
    <path
      fill="none"
      stroke="#c8102e"
      strokeWidth="40"
      d="M0 0L640 480M640 0L0 480"
    />
    <path
      fill="#fff"
      stroke="#fff"
      strokeWidth="100"
      d="M320 0v480M0 240h640"
    />
    <path
      fill="none"
      stroke="#c8102e"
      strokeWidth="60"
      d="M320 0v480M0 240h640"
    />
  </svg>
);

const FlagES = () => (
  <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
    <path fill="#aa151b" d="M0 0h640v480H0z" />
    <path fill="#f1bf00" d="M0 120h640v240H0z" />
  </svg>
);

interface LanguageOption {
  id: string;
  langCode: string; // The code used in URL
  name: string;
  Flag: React.FC;
  color: string;
}

const INITIAL_LANGUAGES: LanguageOption[] = [
  {
    id: "nl",
    langCode: "nl",
    name: "Nederlands",
    Flag: FlagNL,
    color: "text-blue-400",
  },
  {
    id: "fr",
    langCode: "fr",
    name: "Français",
    Flag: FlagFR,
    color: "text-indigo-400",
  },
  {
    id: "en",
    langCode: "en",
    name: "English",
    Flag: FlagGB,
    color: "text-red-400",
  },
  {
    id: "es",
    langCode: "es",
    name: "Español",
    Flag: FlagES,
    color: "text-yellow-400",
  },
];

export const LanguageLabRootHub: React.FC = () => {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState(INITIAL_LANGUAGES);
  const [activeId, setActiveId] = useState<string | null>(null);

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
      setLanguages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const handleSelect = (langCode: string) => {
    navigate(`/language/${langCode}`);
  };

  const activeItem = languages.find((l) => l.id === activeId);

  return (
    <div className="flex bg-black min-h-full text-white font-outfit relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950 to-black">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10 w-full">
        <div className="max-w-5xl w-full">
          {/* Header - Sticky - REMOVED AS REQUESTED */}
          {/* Vlaggen spreken voor zich */}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={languages.map((l) => l.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {languages.map((lang) => (
                  <LanguageCard
                    key={lang.id}
                    lang={lang}
                    onSelect={handleSelect}
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
              {activeItem ? (
                <LanguageCard lang={activeItem} onSelect={() => { }} isOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

const LanguageCard = ({
  lang,
  onSelect,
  isOverlay = false,
}: {
  lang: LanguageOption;
  onSelect: (code: string) => void;
  isOverlay?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lang.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : 1,
  };

  if (isOverlay) {
    return (
      <div className="h-64 scale-105 cursor-grabbing z-50">
        <div className="relative h-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
          <div className="absolute inset-0 opacity-80">
            <lang.Flag />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">
              {lang.name}
            </h3>
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
      className="touch-none h-64 group cursor-pointer"
      onClick={() => onSelect(lang.langCode)}
    >
      <div className="relative h-full rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 group-hover:scale-[1.02] group-hover:border-white/20 group-hover:shadow-[0_0_30px_rgba(255,165,0,0.15)]">
        {/* Flag Background */}
        <div className="absolute inset-0 opacity-100 transition-all duration-500 group-hover:scale-110">
          <lang.Flag />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex justify-between items-end">
            <div>
              <div
                className={`text-xs font-black uppercase tracking-widest mb-2 ${lang.color} opacity-80`}
              >
                VWO Elite Language
              </div>
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter group-hover:text-white transition-colors">
                {lang.name}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-white/20 group-hover:scale-110 transition-all">
              <span className="text-xl">➔</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
