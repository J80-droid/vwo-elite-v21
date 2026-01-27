import { Language } from "@shared/types/common";
import { TFunction } from "@shared/types/i18n";
import { SavedLesson, StudyMaterial } from "@shared/types/index";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Download,
  Edit2,
  Globe,
  Image as ImageIcon,
  Layers,
  Mic,
  Network,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef } from "react";

import { LessonContent } from "../LessonContent";

interface LessonItemProps {
  lesson: SavedLesson;
  isExpanded: boolean;
  onToggle: () => void;
  editingLessonId: string | null;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  setEditingLessonId: (id: string | null) => void;
  handleRenameLesson: (id: string, newTitle: string) => void;

  // Actions
  handleGeneratePodcast: (lesson: SavedLesson) => void;
  handleGenerateImage: (lessonId: string, sectionHeading: string) => void;
  podcastLoading: string | null;
  handleExportPDF: (lesson: SavedLesson) => void;
  handleExportHTML: (lesson: SavedLesson) => void;
  setLessonToDelete: (id: string | null) => void;
  handleConvertToFlashcards: (lesson: SavedLesson) => void;
  onSessionUpdate: (lesson: SavedLesson) => void;

  // Graph Integration
  onExploreInGraph: (lessonId: string) => void;

  // Highlighting & Refs
  highlightedConcepts: Set<string>;
  setHighlightedConcepts: React.Dispatch<React.SetStateAction<Set<string>>>;
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;

  // Translations
  lessonT: Record<string, string | undefined>;
  t: TFunction;
  materials: StudyMaterial[];
  lang: Language;
}

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}> = ({ icon, label, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
            flex items-center gap-3 px-5 py-2.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-700
            ${active
        ? "border-current shadow-[0_0_15px_rgba(99,102,241,0.1)] text-indigo-400 border border-indigo-500/30"
        : "bg-white/5 text-white/20 hover:text-white/60 hover:bg-white/10 border border-transparent"
      }
            ${disabled ? "opacity-10 cursor-not-allowed" : "cursor-pointer"}
        `}
  >
    <span className="opacity-60">{icon}</span>
    <span>{label}</span>
  </button>
);

export const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  isExpanded,
  onToggle,
  editingLessonId,
  editingTitle,
  setEditingTitle,
  setEditingLessonId,
  handleRenameLesson,
  handleGeneratePodcast,
  handleGenerateImage,
  podcastLoading,
  handleExportPDF,
  handleExportHTML,
  setLessonToDelete,
  handleConvertToFlashcards,
  onSessionUpdate,
  onExploreInGraph,
  sectionRefs: _sectionRefs,
  lessonT: _lessonT,
  t,
  highlightedConcepts,
  setHighlightedConcepts: _setHighlightedConcepts,
  lang,
}) => {
  const isEditing = editingLessonId === lesson.id;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const saveTitle = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editingTitle.trim() && lesson.id) {
      handleRenameLesson(lesson.id, editingTitle);
    }
    setEditingLessonId(null);
  };

  return (
    <div
      className={`relative group transition-all duration-700 ${isExpanded ? "mb-12" : "mb-2"
        }`}
    >
      {/* Hairline Expansion Indicator */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "100%" }}
          className="absolute left-6 top-16 w-[1px] bg-gradient-to-b from-indigo-500/20 via-indigo-500/10 to-transparent z-0"
        />
      )}

      {/* HEADER BAR */}
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button, input")) return;
          onToggle();
        }}
        className={`relative z-10 p-6 flex items-center justify-between cursor-pointer transition-all duration-700 border rounded-[2rem] ${isExpanded
          ? "bg-black/20 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.05)]"
          : "bg-black/5 border-white/5 hover:border-white/10"
          }`}
      >
        <div className="flex items-center gap-8 flex-1">
          {/* Expand Icon: Minimal Ring */}
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-700 ${isExpanded
              ? "border-indigo-500/50 text-indigo-400 rotate-180"
              : "border-white/5 text-white/20 group-hover:border-white/10"
              }`}
          >
            <ChevronDown size={18} strokeWidth={1} />
          </div>

          {/* Title Section */}
          <div className="flex-1">
            {isEditing ? (
              <form onSubmit={saveTitle} className="flex items-center gap-4">
                <input
                  ref={inputRef}
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Escape" && setEditingLessonId(null)
                  }
                  className="bg-transparent border-b border-indigo-500/50 py-1 text-white font-extrabold uppercase tracking-wider w-full focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
                <button type="submit" className="text-emerald-400 hover:scale-110 transition-transform"><Check size={16} /></button>
                <button type="button" onClick={() => setEditingLessonId(null)} className="text-rose-400 hover:scale-110 transition-transform"><X size={16} /></button>
              </form>
            ) : (
              <div className="group/title flex items-center gap-4">
                <h3 className="font-space font-extrabold text-white/80 text-lg uppercase tracking-tight transition-colors group-hover:text-white">
                  {lesson.title}
                </h3>
                <button
                  onClick={() => {
                    if (lesson.id) {
                      setEditingLessonId(lesson.id);
                      setEditingTitle(lesson.title);
                    }
                  }}
                  className="opacity-0 group-hover/title:opacity-100 text-white/10 hover:text-indigo-400 transition-all"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1 opacity-20 group-hover:opacity-40 transition-opacity">
              <span className="text-[7px] font-black uppercase tracking-[0.3em]">Sequence 0{lesson.sections?.length || 0}</span>
              <span className="w-1 h-[1px] bg-white" />
              <span className="text-[7px] font-black uppercase tracking-[0.3em]">Zen Core</span>
            </div>
          </div>
        </div>

        {/* Action icons: Hairline minimalist */}
        <div className="flex items-center gap-2 pl-8 border-l border-white/5">
          {[
            { icon: <Download size={18} strokeWidth={1} />, onClick: () => handleExportPDF(lesson), title: "Teleport to PDF" },
            { icon: <Globe size={18} strokeWidth={1} />, onClick: () => handleExportHTML(lesson), title: "Deploy Interactive" },
            { icon: <Trash2 size={18} strokeWidth={1} />, onClick: () => setLessonToDelete(lesson.id || null), color: "hover:text-rose-500" }
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className={`w-10 h-10 flex items-center justify-center text-white/10 transition-all rounded-full hover:bg-white/5 ${action.color || "hover:text-white"}`}
              title={action.title}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="relative z-0 pl-16 pr-4 py-8 animate-in fade-in slide-in-from-top-2 duration-700">
          {/* TOOLBAR: Minimal Float */}
          <div className="flex items-center flex-wrap gap-2 mb-10 opacity-60 hover:opacity-100 transition-opacity">
            <ActionButton
              icon={<Layers size={14} />}
              label="Flashcards"
              onClick={() => handleConvertToFlashcards(lesson)}
            />
            <ActionButton
              icon={<Mic size={14} />}
              label={podcastLoading === lesson.id ? "Synthesizing..." : "Audio Synthesis"}
              onClick={() => handleGeneratePodcast(lesson)}
              disabled={!!podcastLoading}
              active={false}
            />
            <ActionButton
              icon={<ImageIcon size={14} />}
              label="Vision Data"
              onClick={() => {
                if (lesson.id && lesson.sections[0]) {
                  handleGenerateImage(lesson.id, lesson.sections[0].heading);
                }
              }}
            />

            <div className="h-4 w-px bg-white/5 mx-2" />

            <button
              onClick={() => lesson.id && onExploreInGraph(lesson.id)}
              className="flex items-center gap-3 px-6 py-2.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all bg-indigo-500/5 text-indigo-400/60 border border-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-400"
            >
              <Network size={14} />
              <span>{_lessonT.explore_graph || "Graph Analysis"}</span>
            </button>
          </div>

          <div className="opacity-80">
            <LessonContent
              lesson={lesson}
              t={t}
              lang={lang}
              highlightedConcepts={highlightedConcepts}
              setHighlightedConcepts={_setHighlightedConcepts}
              onConvertToFlashcards={handleConvertToFlashcards}
              onSessionUpdate={onSessionUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};
